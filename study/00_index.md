# NetHack 5.0 소스 코드 학습 가이드

이 문서 시리즈는 NetHack 5.0 소스 코드를 처음 접하는 사람이 전체 구조를 빠르게
파악할 수 있도록 작성된 구조적 학습 가이드입니다.

## 이 프로젝트는 무엇인가?

NetHack은 1985년부터 이어져 온 고전 로그라이크(roguelike) 게임입니다.
Rogue와 Hack의 후손이며, NetHack 3.6의 직계 후속 버전이 바로 이
**NetHack 5.0**입니다. (정확히는 5.0.1 작업중 버전)

- 단일 C언어 코드베이스(`src/`)가 게임 로직의 핵심
- 플랫폼별 포팅 코드(`sys/`, `win/`)가 그 주변을 감쌈
- 게임 데이터(레벨, 몬스터, 던전 구조)는 **Lua 스크립트**(`dat/*.lua`)로 정의
- `Makefile` 기반 빌드 + "hints" 설정 시스템으로 크로스컴파일 지원

## 문서 목차

| 번호 | 문서 | 내용 |
|------|------|------|
| 00 | [index.md](00_index.md) | 이 문서 (목차 및 읽는 방법) |
| 01 | [project_overview.md](01_project_overview.md) | 프로젝트 개요: 역사, 버전, 5.0의 주요 변화 |
| 02 | [directory_structure.md](02_directory_structure.md) | 최상위 폴더 구조와 각 디렉터리의 역할 |
| 03 | [source_architecture.md](03_source_architecture.md) | 소스 파일 구조, 헤더 체계, 게임 루프 |
| 04 | [build_system.md](04_build_system.md) | Makefile/hints 빌드 시스템, 설치 과정 |
| 05 | [lua_integration.md](05_lua_integration.md) | Lua 통합: 레벨/던전/퀘스트 컴파일러 대체 |
| 06 | [window_system.md](06_window_system.md) | 윈도우 포트(windowing port) 인터페이스 |
| 07 | [platform_ports.md](07_platform_ports.md) | 플랫폼 포트와 크로스컴파일, WASM |
| 08 | [development_workflow.md](08_development_workflow.md) | 개발 워크플로우, git 훅, 코딩 스타일 |

## 추천 학습 순서

처음이라면 아래 순서로 읽는 것을 권장합니다.

1. **01_project_overview.md** — "이게 뭔지" 먼저 이해
2. **02_directory_structure.md** — 디렉터리 지도를 머리에 넣기
3. **04_build_system.md** — 직접 빌드해보기 (`cd sys/unix && sh setup.sh hints/linux.501 && cd ../.. && make all`)
4. **03_source_architecture.md** — 소스 코드의 핵심 구조와 게임 루프 파악
5. **05_lua_integration.md** — 5.0의 가장 큰 변화인 Lua 시스템
6. **06_window_system.md** — 게임 로직과 화면 출력의 분리 방식
7. **07_platform_ports.md** — 여러 OS를 어떻게 지원하는지
8. **08_development_workflow.md** — 실제 기여할 때 필요한 도구와 규칙

## 핵심 파일 빠른 참조

| 파일 | 역할 |
|------|------|
| `README` | 공식 안내문. 빌드 전 반드시 읽을 것 |
| `Files` | 배포본에 포함된 **모든 파일 목록** (각 파일의 용도 주석 포함) |
| `include/hack.h` | 게임 전역의 메인 헤더. 거의 모든 `.c`가 include |
| `src/allmain.c` | `moveloop()` 게임 메인 루프 |
| `src/hack.c` | 게임 시작/커맨드 처리의 중심 |
| `src/nhlua.c` | C↔Lua 바인딩의 핵심 |
| `dat/nhcore.lua`, `dat/nhlib.lua` | Lua 측 코어 라이브러리 |
| `sys/unix/NewInstall.unx` | UNIX 설치 지침 |
| `DEVEL/Developer.txt` | 개발자용 git 설정/훅 안내 |

## 용어 사전

- **Top 디렉터리**: 소스 최상위 디렉터리 (`README`가 있는 곳)
- **playground**: 게임 실행 시 데이터 파일이 위치하는 디렉터리
- **hints 파일**: 빌드 설정이 담긴 Makefile 조각 파일 (`sys/unix/hints/*.501`)
- **window port**: 특정 UI(tty, X11, Qt, curses 등) 구현체
- **DLB**: Data LiBrary. 게임 데이터 파일을 하나로 묶는 옵션
- **makedefs**: 게임 데이터를 생성하는 유틸리티
- **nhsub/nhadd/nhcommit**: RCS/CVS식 변수 치환을 수행하는 git 래퍼
