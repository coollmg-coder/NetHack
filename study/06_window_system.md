# 06. 윈도우 포트(인터페이스) 시스템

NetHack은 게임 로직(`src/`)과 화면 출력/입력을 완전히 분리합니다. 이 장은
그 "윈도우 포트(windowing port)" 인터페이스가 어떻게 동작하는지 설명합니다.

## 1. 개념

게임 코어는 화면에 직접 그리지 않습니다. 대신 **함수 포인터 테이블**인
`struct window_procs` (`include/winprocs.h`)를 통해 UI에 작업을 위임합니다.

- 게임 코어: "이 창에 이 문자열을 그려줘", "키 입력을 받아줘" 같은 요청만
- 윈도우 포트: 요청을 실제 tty/X11/Qt 등에 맞게 구현

이 덕분에 **하나의 바이너리에 여러 인터페이스를 동시에** 넣을 수 있습니다
(멀티윈도우 지원).

## 2. `struct window_procs` 인터페이스

`include/winprocs.h:32`에 정의된 함수 포인터 테이블입니다. 대표적인 멤버:

| 멤버 | 역할 |
|------|------|
| `win_init_nhwindows` | 윈도우 시스템 초기화 |
| `win_get_nh_event` | 이벤트(입력) 가져오기 |
| `win_create_nhwindow` | 창 생성 |
| `win_putstr` | 문자열 출력 |
| `win_print_glyph` | 글리프(타일/문자) 출력 |
| `win_nhgetch` | 단일 키 입력 |
| `win_yn_function` | yes/no 질문 |
| `win_getlin` | 한 줄 입력 |
| `win_start_menu`/`win_end_menu`/`win_select_menu` | 메뉴 처리 |
| `win_status_update` | 상태 바 갱신 |
| `win_exit_nhwindows` | 종료 |

전역 변수 `windowprocs`가 현재 사용 중인 테이블을 가리킵니다
(`include/winprocs.h:111`).

## 3. 윈도우 포트 구현체 (`win/`)

각 디렉터리가 하나의 윈도우 포트입니다.

| 디렉터리 | 인터페이스 | 비고 |
|----------|-----------|------|
| `win/tty/` | 전통 텍스트 | 기본값 |
| `win/curses/` | curses | ncurses 기반 |
| `win/X11/` | X11 GUI | 타일/윈도우 |
| `win/Qt/` | Qt 위젯 | Qt5/Qt6 |
| `win/win32/` | Windows GUI | |
| `win/gem/` | GEM (Atari) | |
| `win/share/` | (공용) | 타일 그래픽 공용 코드 |
| `win/chain/` | WINCHAIN | 여러 포트 연결 |
| `win/shim/` | 콜백 shim | 라이브러리/WASM용 |

각 포트는 `winXXX.c` 같은 파일에 `window_procs` 인스턴스를 정의하고,
`win_init_nhwindows` 등 콜백을 구현합니다.

## 4. 윈도우 타입

`doc/window.txt`에 따르면 4가지 기본 창 타입이 있습니다 (요약):

- **MAP** — 게임 맵 표시
- **MESSAGE** — 메시지 로그
- **STATUS** — 상태 바
- **MENU / TEXT** — 메뉴와 텍스트

`create_nhwindow(type)`로 창을 만들고 `winid` 핸들을 받아 사용합니다.

## 5. WINCHAIN (`win/chain/`)

WINCHAIN은 여러 윈도우 포트를 하나로 **연결**하는 메커니즘입니다
(`make WANT_WINCHAIN=1`). 예를 들어 tty에서 입력받고 curses로 출력하는 식의
조합이 가능합니다. `win/chain/wc_chainin.c`, `wc_chainout.c`, `wc_trace.c`.

## 6. 그래픽 shim (`win/shim/`)

`win/shim/winshim.c`은 특수한 포트로, 화면/입력을 **콜백 함수**로 전달합니다.
이것이 `libnethack` 라이브러리와 WASM 빌드의 기반입니다 (07장 참고).

`sys/libnh/README.md`에 설명된 API:

- `nhmain(argc, argv)` — 게임 실행 진입점
- `shim_graphics_set_callback(cb)` — 그래픽 콜백 등록

콜백은 `name`(윈도우 함수 이름)과 `fmt`(시그니처 문자열)로 호출되어,
호스트 프로그램(또는 JavaScript)이 화면을 렌더링하게 합니다.

## 7. 윈도우 포트 관련 헤더

| 헤더 | 내용 |
|------|------|
| `include/winprocs.h` | `struct window_procs` 인터페이스 |
| `include/wintype.h` | 창 타입/핸들 정의 |
| `include/display.h` | 글리프/표시 정의 |
| `include/winX.h`, `include/wintty.h`, `include/wincurs.h` 등 | 포트별 헤더 |
| `include/winami.h`, `include/windconf.h` | 플랫폼별 |

## 8. 새 윈도우 포트 추가 흐름 (요약)

1. `win/` 아래에 새 디렉터리 생성
2. `struct window_procs`를 채우는 구현 작성
3. hints/빌드에 `WANT_WIN_XXX=1` 플래그 연결
4. `doc/window.txt`의 인터페이스 스펙을 준수

## 9. 요약 다이어그램

```
게임 코어 (src/)  ── windowprocs (함수 포인터) ──▶  win/tty
                                          │▶  win/curses
                                          │▶  win/X11
                                          │▶  win/Qt
                                          └▶  win/shim → (콜백) → 호스트/JS
```
