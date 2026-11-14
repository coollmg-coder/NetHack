# 02. 디렉터리 구조

이 장에서는 NetHack 5.0 소스 트리의 최상위 디렉터리 구조와 각 디렉터리의
역할을 설명합니다. 전체 파일 목록은 최상위 `Files` 파일에 권위 있는
정리(각 파일의 용도 주석 포함)가 있으므로 함께 참고하세요.

## 최상위 디렉터리 한눈에 보기

```
NetHack/
├── dat/           # 게임 데이터 (레벨/던전/퀘스트 정의, 대부분 Lua)
├── doc/           # 문서 (Guidebook, 매뉴얼 페이지, fix 기록)
├── include/       # C 헤더 파일 (전역 상수/구조체/선언)
├── src/           # 게임 코어 C 소스 (플랫폼 독립적)
├── sys/           # OS별 포팅 코드 (unix/windows/msdos/amiga/vms 등)
├── win/           # UI(윈도우 포트) 구현 (tty/curses/X11/Qt/win32 등)
├── util/          # 빌드/보조 유틸리티 (makedefs, recover, dlb 등)
├── nhlua/         # NetHack이 내장하는 Lua 소스 트리 (5.4.x)
├── lib/           # lua 소스의 복사본 (빌드 산출물 포함, .gitignore 대상)
├── targets/       # 크로스컴파일 산출물 (예: targets/wasm/)
├── submodules/    # git 서브모듈 (pdcurses, pdcursesmod)
├── sound/         # 사운드 관련 소스/에셋
├── outdated/      # 더 이상 유지보수되지 않는 구버전 포팅 코드
├── DEVEL/         # 개발자용 도구/문서 (git 훅, 코드 스타일)
├── test/          # Lua 기반 자동 테스트
├── web/           # (현재) WASM 웹 프론트 의존성(node_modules/three)
└── (루트 파일들)  # Makefile, README, Files, Cross-compiling 등
```

## 핵심 디렉터리 상세

### `src/` — 게임 코어 (플랫폼 독립)

게임 로직의 전부가 들어 있습니다. 약 140개의 `.c` 파일이 존재하며,
특정 OS/UI에 의존하지 않는 "순수" 게임 코드입니다.

- `allmain.c` — `moveloop()` 메인 게임 루프
- `hack.c` — 게임 초기화, 명령어 처리, 저장/복원 진입점
- `mklev.c`, `mkmaze.c`, `mkroom.c` — 던전/맵 생성
- `mon.c`, `monmove.c`, `makemon.c` — 몬스터 로직
- `objects.c`, `o_init.c` — 오브젝트 정의/초기화
- `save.c`, `restore.c` — 세이브/복원
- `nhlua.c`, `nhlobj.c`, `nhlsel.c` — Lua 바인딩

> 파일 하나하나의 역할은 `Files` 파일의 `src:` 섹션에서 한 줄씩 나열된
> 이름을 보면 대략 추측할 수 있습니다. 상세한 로직은 03장에서 다룹니다.

### `include/` — 헤더

전역 상수, 구조체 정의, 함수 선언이 담깁니다.

- `hack.h` — 메인 헤더. 대부분의 `.c`가 이 하나를 include
- `config.h` — 플랫폼별 매크로 설정 (빌드 시 생성/선택)
- `extern.h` — 전역 함수 선언 모음
- `decl.h` — 전역 변수 선언 모음
- `global.h` — 전역 변수 정의
- `obj.h`, `monst.h`, `you.h`, `dungeon.h` 등 — 각 게임 개체의 구조체 정의
- `winprocs.h` — 윈도우 포트 인터페이스 정의 (06장 참고)

### `dat/` — 게임 데이터

게임의 "정적 데이터"가 들어 있습니다. 5.0에서 대부분 Lua 파일로 전환되었습니다.

- 레벨/던전/퀘스트 정의: `*.lua` (예: `knox.lua`, `castle.lua`, `dungeon.lua`)
- 직업별 퀘스트: `Arc-*.lua`, `Bar-*.lua`, ... `Wiz-*.lua`
- Lua 코어 라이브러리: `nhcore.lua`, `nhlib.lua`
- 기타 텍스트 데이터: `data.base`, `rumors.tru`, `oracles.txt`, `epitaph.txt`
- `license` — 라이선스 (빌드 전 필독)

### `sys/` — OS별 포팅

운영체제에 의존하는 코드가 모여 있습니다.

- `sys/unix/` — Linux/macOS용 Makefile 템플릿, 설치 스크립트, hints
- `sys/windows/` — Windows용 빌드 파일
- `sys/msdos/`, `sys/amiga/`, `sys/vms/`, `sys/atari/`, `sys/mac68k/`
- `sys/share/` — 여러 OS가 공유하는 파일 (난수, uudecode 등)
- `sys/libnh/` — NetHack을 라이브러리로 만드는 코드 (07장 참고)

### `win/` — 윈도우 포트(UI)

특정 UI 구현체가 모여 있습니다. (06장에서 상세히 다룸)

- `win/tty/` — 전통 텍스트 인터페이스
- `win/curses/` — curses 기반
- `win/X11/` — X11 GUI
- `win/Qt/` — Qt 위젯 기반
- `win/win32/` — Windows GUI
- `win/share/` — 타일 그래픽 공용 코드
- `win/chain/` — 여러 윈도우 포트를 연결하는 WINCHAIN
- `win/shim/` — 콜백 기반 그래픽(라이브러리/WASM용)

### `util/` — 보조 유틸리티

빌드 과정과 게임 운영에 필요한 보조 프로그램의 소스.

- `makedefs.c` — 게임 데이터 생성 유틸리티
- `recover.c` — 크래시 후 게임 복구 도구
- `dlb_main.c` — 데이터 라이브러리(DLB) 도구
- `sfctool.c` — 세이브파일 유틸리티

## 특수/보조 디렉터리

| 디렉터리 | 설명 |
|----------|------|
| `nhlua/` | NetHack이 내장한 Lua 5.4.x 소스 트리 (업스트림 복사본) |
| `lib/` | 빌드 과정에서 생성되는 Lua 라이브러리 복사본 (git 무시) |
| `targets/` | 크로스컴파일 결과물 (`targets/wasm/nethack.wasm` 등, git 무시) |
| `submodules/` | PDCurses 관련 git 서브모듈 |
| `outdated/` | 더 이상 관리되지 않는 구버전 포팅 (BeOS, GNOME, OS/2 등) |
| `DEVEL/` | 개발 인프라: git 훅(`hooksdir/`), 코드 스타일, VERSION |
| `test/` | Lua 테스트 스크립트 (`test_*.lua`) |
| `sound/` | 사운드 라이브러리/에셋 |
| `web/` | WASM 웹 프론트엔드 의존성 (현재 `three` 라이브러리) |

## 루트 레벨 주요 파일

| 파일 | 역할 |
|------|------|
| `Makefile` | **자동 생성**된 최상위 Makefile (직접 편집 금지) |
| `README` | 공식 안내. 빌드 전 필독 |
| `Files` | 전체 파일 목록과 용도 설명 |
| `Cross-compiling` | 크로스컴파일 가이드 |
| `Porting` | 새 플랫폼 포팅 가이드 |
| `Contributing.md` | 기여 가이드 |
| `.gitattributes` | git 변수 치환(NHSUBST) 설정 |
| `.gitmodules` | git 서브모듈 정의 |
| `.clang-format` | 코드 포맷 규칙 |
| `azure-pipelines.yml` | CI 파이프라인 |

## 주의: 생성 파일 vs 소스 파일

빌드 과정에서 생성되는 파일들이 존재합니다. 이들은 git에 커밋되지 않으며
(대부분 `.gitignore`에 있음), `Files` 파일 하단에 "generated files"로
정리되어 있습니다.

- 각 디렉터리의 `Makefile` (생성됨)
- `src/*.o`, `src/hacklib.a` (오브젝트/라이브러리)
- `dat/data`, `dat/oracles`, `dat/rumors` (makedefs 생성)
- `targets/wasm/*` (WASM 빌드 결과)
- `src/config.h-t`, `src/hack.h-t` (빌드 중 임시 복사본)

> 빌드를 완전히 초기화하려면 `make spotless`를 사용합니다.
