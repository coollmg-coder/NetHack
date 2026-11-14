# 03. 소스 코드 구조와 아키텍처

이 장은 게임 코어(`src/`)의 구조, 헤더 체계, 그리고 게임이 어떻게
흘러가는지(메인 루프)를 설명합니다.

## 1. 계층 구조 (Layering)

NetHack 코드는 크게 세 계층으로 나뉩니다.

```
┌─────────────────────────────────────────────────┐
│  win/  (윈도우 포트: tty, X11, Qt, curses...)  │  ← UI 계층
├─────────────────────────────────────────────────┤
│  sys/  (OS 포팅: unix, windows, msdos, ...)     │  ← OS 계층
├─────────────────────────────────────────────────┤
│  src/  (게임 코어, 플랫폼 독립)                 │  ← 코어 계층
└─────────────────────────────────────────────────┘
```

- **src/** 는 특정 OS나 UI에 의존하지 않음. 화면 출력·입력은 모두
  `windowprocs`라는 함수 포인터 테이블을 통해 `win/`에 위임 (06장 참고)
- **sys/** 는 파일 I/O, 난수, 터미널 등 OS 수준 기능을 제공
- **win/** 은 화면 그리기, 키 입력, 메뉴 표시 등을 담당

## 2. 헤더 체계

`include/`에는 96개의 헤더가 있습니다. 핵심은 아래 몇 개로 압축됩니다.

### `hack.h` — 메인 헤더

거의 모든 `.c` 파일이 `#include "hack.h"` 한 줄로 시작합니다.
`hack.h`는 다른 주요 헤더들을 모두 끌어들이는 "우산" 역할을 합니다.

```
hack.h
 ├── config.h       (플랫폼별 매크로)
 ├── lint.h
 ├── align.h, weight.h, dungeon.h, stairs.h ...
 ├── objclass.h, wintype.h, flag.h, sym.h, trap.h ...
 ├── youprop.h, display.h
 └── botl.h, context.h, obj.h, quest.h, rm.h, you.h,
     winprocs.h, vision.h, spell.h, sys.h, timeout.h ...
```

### 전역 선언/정의 삼분법

NetHack의 오래된 C 코드베이스는 전역 변수를 세 파일로 나눕니다.

| 파일 | 역할 |
|------|------|
| `decl.h` | 전역 변수 `extern` 선언 |
| `global.h` | 전역 변수 **정의** (실제 메모리 할당). 이 파일은 **단 한 번만** 컴파일 |
| `extern.h` | 전역 **함수** 선언 모음 (약 1583개) |

이 방식의 이유: 여러 `.c` 파일에서 전역 변수를 공유하면서도 정의는 한 곳에
두기 위함. `global.h`는 `src/decl.c`에서만 include되어 변수가 단일 정의되도록
합니다.

### 주요 구조체 정의 헤더

| 헤더 | 정의하는 것 |
|------|-------------|
| `obj.h` | 오브젝트(`struct obj`) — 아이템/몬스터 공용 개체 |
| `monst.h` | 몬스터 인스턴스(`struct monst`) |
| `permonst.h` | 몬스터 종족 프로토타입(`struct permonst`) |
| `you.h` | 플레이어 상태(`struct you`) |
| `dungeon.h` | 던전/레벨 구조(`struct d_level` 등) |
| `rm.h` | 맵/룸(`struct rm`) — 한 타일의 상태 |
| `trap.h`, `engrave.h`, `region.h`, `vision.h` | 각 게임 요소 |
| `func_tab.h` | 명령어 디스패치 테이블 |
| `winprocs.h` | 윈도우 포트 인터페이스 |

## 3. 게임 실행 흐름

### 시작 (startup)

1. 각 플랫폼의 `main()` (예: `sys/unix/unixmain.c`)이 실행
2. `sys_early_init()` → `early_init()` (`allmain.c`)에서 전역 초기화
3. 명령줄 옵션 처리 (`process_options`)
4. 세이브 복원 또는 신규 캐릭터 생성
5. `moveloop()` 진입

### 메인 루프 — `moveloop()` (`src/allmain.c`)

```c
moveloop(boolean resuming) {
    moveloop_preamble(resuming);   // 달의 위상, 금요일 13일 등
    if (!resuming) maybe_do_tutorial();
    for (;;) {
        moveloop_core();           // 핵심: 한 "턴" 처리
    }
}
```

`moveloop_core()`가 하는 일 (개념적으로):

1. 화면 갱신 (`doredraw`)
2. 플레이어 명령 입력 (윈도우 포트 경유)
3. 명령 해석/실행 (cmd.c, do.c 등)
4. 플레이어 행동 처리 (이동, 공격, 아이템 사용...)
5. 몬스터 행동 처리 (`monmove.c`, `dogmove.c`)
6. 턴 종료 처리 (회복, 함정, 타임아웃, 시간 경과)
7. 사망/승리 검사

### 명령어 디스패치

사용자 입력 → 명령어는 `include/func_tab.h`의 `extcmdlist[]` 테이블과
`src/cmd.c`를 통해 처리됩니다.

- 각 명령은 `struct ext_func_tab` 항목: 키, 설명, 함수 포인터, 플래그
- 예: 이동 명령은 `MOVEMENTCMD` 플래그, 마법사 모드 명령은 `WIZMODECMD`
- 실제 행동 구현은 `do.c`, `do_wear.c`, `dothrow.c`, `dokick.c` 등에 분산

## 4. 소스 파일 그룹핑

`src/`의 약 140개 파일을 기능별로 묶어보면 다음과 같습니다.

### 게임 흐름 / 초기화
- `hack.c` — 시작, 명령 처리, 저장/복원 진입, 게임 종료
- `allmain.c` — 메인 루프
- `end.c` — 죽음/승리 처리 (tombstone 등)
- `topten.c` — 점수 기록
- `u_init.c` — 플레이어 초기화
- `earlyarg.c` — 초기 인자 처리

### 맵 / 던전 생성
- `mklev.c`, `mkmap.c`, `mkmaze.c`, `mkroom.c` — 레벨/룸/미로 생성
- `dungeon.c` — 던전 브랜치 구조
- `sp_lev.c` — 특수 레벨 (Lua 연동)
- `extralev.c` — 추가 레벨

### 몬스터
- `mon.c`, `monst.c`, `mondata.c` — 몬스터 데이터/유틸
- `makemon.c` — 몬스터 생성
- `monmove.c` — 몬스터 이동 AI
- `mhitm.c`, `mhitu.c`, `mthrowu.c` — 전투
- `dog.c`, `dogmove.c` — 펫 AI
- `muse.c` — 몬스터 아이템 사용

### 오브젝트 / 아이템
- `objects.c`, `o_init.c` — 오브젝트 정의/초기화
- `objnam.c` — 오브젝트 이름 생성 (문법)
- `invent.c` — 인벤토리
- `pickup.c` — 아이템 줍기
- `do_wear.c`, `wield.c`, `worn.c` — 장비
- `potion.c`, `spell.c` — 포션/주문

### 플레이어 행동
- `do.c` — 일반 행동
- `apply.c` — 도구 사용
- `eat.c` — 식사
- `read.c` — 두루마리 읽기
- `dothrow.c`, `dokick.c` — 던지기/발차기
- `polyself.c` — 변신
- `sit.c`, `pray.c` — 앉기/기도

### 시스템 / 지원
- `alloc.c` — 메모리 관리
- `rnd.c` — 난수
- `hacklib.c`, `mdlib.c`, `strutil.c` — 유틸리티 함수
- `files.c` — 파일 경로/관리
- `dlb.c` — 데이터 라이브러리(DLB)
- `save.c`, `restore.c` — 세이브/복원
- `vision.c`, `display.c`, `drawing.c`, `botl.c` — 화면 표시 관련
- `pline.c` — 메시지 출력
- `windows.c` — 윈도우 포트 관리

### Lua 바인딩 (05장 상세)
- `nhlua.c` — Lua 인터프리터 초기화 및 C 함수 등록
- `nhlobj.c` — 오브젝트를 Lua에 노출
- `nhlsel.c` — 선택(selection) 처리

### 기타
- `rumors.c` — 소문(쿠키)
- `calendar.c` — 게임 내 달력/시간
- `date.c` — 실제 날짜
- `wizard.c`, `wizcmds.c` — 마법사(디버그) 모드
- `isaac64.c` — ISAAC64 난수 생성기
- `nhmd4.c` — MD4 해시 (세이브 무결성)
- `glyphs.c`, `symbols.c` — 심볼/글리프 매핑

## 5. 핵심 전역 객체

코드를 읽을 때 자주 만나는 전역 객체들입니다.

| 식별자 | 타입 | 의미 |
|--------|------|------|
| `u` | `struct you` | 플레이어 상태 |
| `flags` | `struct flag` | 실행 옵션 플래그 |
| `iflags` | `struct instance_flags` | 게임 인스턴스별 플래그 |
| `program_state` | `struct program_state` | 프로그램 실행 상태 |
| `moves` / `svm.moves` | int | 턴 카운터 |
| `windowprocs` | `struct window_procs` | UI 함수 포인터 테이블 |
| `level` | `d_level` | 현재 레벨 좌표 |
| `levl` | `struct rm[][]` | 현재 맵 타일 배열 |
| `fobj`, `invent` | `struct obj*` | 바닥/인벤토리 오브젝트 리스트 |

## 6. 코드 스타일 요약

`DEVEL/code_style.txt`에 정리된 규칙의 핵심:

- C99, 4칸 스페이스 들여쓰기 (탭 금지)
- 한 줄 최대 78자
- ANSI 스타일 함수 선언/정의
- 소스 파일 상단에 `$NHDT-Header:` 헤더 + Copyright 주석
- `staticfn` 매크로로 static 함수 표기 (`include/hack.h` 내 정의)

## 7. 처음 읽기 좋은 파일 (추천 경로)

소스를 처음 읽는다면 아래 순서가 자연스럽습니다.

1. `include/hack.h` — 매크로/상수 감 잡기
2. `src/hack.c` — 게임 시작 흐름
3. `src/allmain.c` — `moveloop()` 메인 루프
4. `src/cmd.c` — 명령어 디스패치
5. `src/do.c` — 실제 행동 구현
6. `src/mklev.c` — 던전 생성
7. `src/nhlua.c` — Lua 연동 (05장과 병행)
