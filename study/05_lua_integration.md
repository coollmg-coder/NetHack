# 05. Lua 통합 시스템

NetHack 5.0의 가장 큰 구조적 변화는 빌드 시점의 `yacc`/`lex` 기반 도구들을
**게임 내장 Lua 스크립트**로 대체한 것입니다. 이 장에서는 C 코드와 Lua가
어떻게 결합되는지 설명합니다.

## 1. 왜 Lua인가?

5.0 이전에는 다음 3가지가 빌드 시점에 별도 도구로 처리되었습니다.

1. **레벨 컴파일러** (`yacc`/`lex` 기반) — 특수 레벨 `.des` 파일
2. **던전 컴파일러** — 던전 구조(`dungeon.def`)
3. **퀘스트 텍스트 처리** — `makedefs`가 수행

5.0에서는 이들이 **게임이 실행 중에 직접 읽는 Lua 텍스트**로 바뀌었습니다.
이로써 빌드 과정이 단순해지고, 게임 데이터를 더 유연하게 기술할 수 있게
되었습니다.

## 2. Lua 소스 트리

NetHack은 Lua 5.4.x 인터프리터를 소스 트리에 내장하고 있습니다.

| 위치 | 설명 |
|------|------|
| `nhlua/` | NetHack이 관리하는 Lua 소스 트리 (업스트림 복사본) |
| `nhlua/lua/` | 실제 Lua 소스 (`src/lapi.c`, `lvm.c` 등) |
| `nhlua/README_NHLUA` | Lua 버전 업데이트 방법 |
| `nhlua/nhlua-update.sh` | 업스트림 tarball에서 트리 갱신 스크립트 |
| `lib/lua-5.4.8/` | 빌드 과정에서 사용되는 복사본 (git 무시) |

빌드 시 `nhlua/lua/src/*.c`가 컴파일되어 게임과 함께 링크됩니다.
(버전은 `Makefile`의 `LUA_VERSION=5.4.8`로 관리)

## 3. C ↔ Lua 바인딩

### 핵심 파일: `src/nhlua.c`

`src/nhlua.c`는 C와 Lua 사이의 다리 역할을 합니다. 주요 기능:

- `nhl_init()` — Lua 상태(`lua_State`) 생성, 표준 라이브러리 로드
- `nhl_done()` — Lua 상태 정리
- `nhl_functions[]` — NetHack이 Lua에 제공하는 C 함수 테이블
  (`src/nhlua.c:1842` 부근)
- 샌드박스 지원 (`NHL_SANDBOX`, `setjmp` 기반)

Lua에 노출되는 C 함수들은 `nhl_` 접두사를 가집니다 (예: `nhl_pline`,
`nhl_menu`, `nhl_getmap`, `nhl_doturn`, `nhl_callback` 등).

### 부가 바인딩 파일

| 파일 | 역할 |
|------|------|
| `nhlobj.c` | 오브젝트(`struct obj`)를 Lua에 노출 |
| `nhlsel.c` | 선택(selection) 처리 |

### 관련 헤더

- `include/nhlua.h` — Lua 인터페이스 선언

## 4. Lua 측 코어 라이브러리 (`dat/`)

게임이 사용하는 Lua 코드는 `dat/`에 있습니다.

| 파일 | 역할 |
|------|------|
| `nhcore.lua` | 코어 라이브러리. 게임 시작 시 한 번 로드되어 메모리에 상주. 콜백(callback) 등록/실행, 변수 직렬화 등 |
| `nhlib.lua` | 공용 헬퍼 라이브러리 |
| `dungeon.lua` | **던전 구조** 정의 (브랜치/지부 트리) |
| `*.lua` (castle, knox, valley 등) | **특수 레벨** 정의 |
| `Arc-*.lua` ~ `Wiz-*.lua` | **직업별 퀘스트** 정의 (role-접두사) |
| `quest.lua` | 퀘스트 기본 구조 |

### 예: 던전 정의 (`dat/dungeon.lua`)

```lua
dungeon = {
   {
      name = "The Dungeons of Doom",
      base = 25,
      range = 5,
      branches = {
         { name = "The Gnomish Mines", base = 2, range = 3 },
         { name = "Sokoban", chainlevel = "oracle", direction = "up" },
         { name = "The Quest", branchtype = "portal" },
         { name = "Gehennom", ... },
      },
   },
}
```

이 Lua 테이블이 곧 던전 브랜치 구조를 정의합니다. 과거 `dungeon.def` 텍스트를
컴파일하던 것을 대체합니다.

## 5. 콜백 메커니즘

`nhcore.lua`의 `nh_callback_set/rm/run`은 NetHack의 이벤트 시스템과 연동됩니다.

- C 쪽에서 이벤트가 발생하면 대응하는 Lua 콜백을 실행
- `nh_lua_variables` 테이블은 **세이브/복원 시 직렬화**되어 게임 상태에 포함
  (`get_variables_string()`)

## 6. 게임 데이터 생성 (`util/makedefs.c`)

완전히 사라진 것은 아닙니다. `makedefs`는 여전히 일부 데이터를 생성합니다.

- `dat/data` — 오브젝트/몬스터 데이터 (컴파일된 형태)
- `dat/oracles`, `dat/rumors` — 텍스트 데이터
- `monstr.c` — 몬스터 문자열 (5.0에서는 미사용)

## 7. 테스트 (`test/`)

Lua 테스트 스크립트가 `test/`에 있습니다.

- `test_*.lua` — 레벨/오브젝트/몬스터/명령 등 단위 테스트
- `test/README.md` — 테스트 실행 방법

## 8. 요약: Lua가 담당하는 것 vs C가 담당하는 것

| 영역 | 담당 |
|------|------|
| 게임 루프, 전투, 이동 등 실시간 로직 | C (`src/`) |
| 화면/입력 (윈도우 포트) | C (`win/`) |
| 던전 구조, 특수 레벨, 퀘스트 정의 | Lua (`dat/*.lua`) |
| 게임 데이터(오브젝트/몬스터 스탯) | C 테이블 + `makedefs` |
| Lua 인터프리터 자체 | 내장 Lua (`nhlua/`) |
