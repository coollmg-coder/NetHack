# 07. 플랫폼 포트와 크로스컴파일

NetHack 5.0은 여러 운영체제에서 동작하며, 한 OS에서 다른 OS용 바이너리를
만드는 크로스컴파일을 지원합니다.

## 1. OS별 포팅 코드 (`sys/`)

각 운영체제에 의존하는 코드가 `sys/` 아래에 모여 있습니다.

| 디렉터리 | 대상 OS | 비고 |
|----------|---------|------|
| `sys/unix/` | Linux, macOS, BSD | 주력. Makefile 템플릿 + hints |
| `sys/windows/` | Windows 10/11 | MSYS2, nmake, Visual Studio |
| `sys/msdos/` | MS-DOS | djgpp 크로스컴파일 |
| `sys/amiga/` | AmigaOS | |
| `sys/atari/` | Atari TOS | |
| `sys/mac68k/` | 68K Macintosh | retro68 |
| `sys/vms/` | OpenVMS | |
| `sys/share/` | (공용) | 난수, uudecode, termcap 등 |
| `sys/libnh/` | (라이브러리) | libnethack.a / WASM |

각 포트는 `main()` 함수(예: `sys/unix/unixmain.c`, `sys/windows/windmain.c`)와
OS 특화 기능(파일 I/O, 터미널, 시간 등)을 제공합니다.

### `sys/unix/` 세부

| 파일 | 역할 |
|------|------|
| `setup.sh` | Makefile 생성 진입점 |
| `mkmkfile.sh` | Makefile 생성기 |
| `Makefile.top/.dat/.doc/.src/.utl` | Makefile 템플릿 |
| `NewInstall.unx`, `Install.unx` | 설치 지침 |
| `hints/` | 플랫폼별 설정 조각 |
| `unixmain.c` | UNIX용 `main()` |
| `unixunix.c`, `unixres.c` | UNIX 특화 기능 |
| `nethack.sh` | 실행 래퍼 스크립트 |

## 2. 크로스컴파일

빌드 머신(host)과 실행 머신(target)을 분리하는 기능입니다. 최상위
`Cross-compiling` 파일에 상세 지침이 있습니다.

### 지원 타깃 (make 변수)

| 변수 | 대상 |
|------|------|
| `CROSS_TO_MSDOS=1` | MS-DOS (djgpp) |
| `CROSS_TO_WASM=1` | WebAssembly |
| `CROSS_TO_MIPS=1` | MIPS |

hints 조각 `sys/unix/hints/include/cross-*.501`이 크로스컴파일 로직을 담당합니다.

## 3. libnethack 라이브러리 (`sys/libnh/`)

NetHack을 **다른 프로그램에 내장**할 수 있는 라이브러리로 만드는 기능입니다
(`make WANT_LIBNH=1`). 두 가지 형태를 제공합니다:

1. **`libnethack.a`** — Unix 정적 라이브러리
2. **`nethack.js` / `nethack.wasm`** — WebAssembly 모듈 (브라우저/Node.js)

### API (간단 요약, `sys/libnh/README.md` 참고)

```c
int nhmain(int argc, char *argv[]);               // 게임 실행
void shim_graphics_set_callback(shim_callback_t cb); // 그래픽 콜백 등록
```

그래픽은 `win/shim` 포트를 통해 콜백으로 전달되므로, 호스트 프로그램이
자체적으로 화면을 그릴 수 있습니다. (06장 참고)

### WASM 빌드

```sh
cd sys/unix
./setup.sh hints/linux.501   # 또는 macOS.501
cd ../..
make CROSS_TO_WASM=1 all
```

결과물은 `targets/wasm/`에 생성됩니다:

- `nethack.wasm`, `nethack.js` — WASM 모듈 + JS 로더
- `wasm-data/` — 게임 데이터 파일
- `lua548.a`, `hacklib.a` — 중간 라이브러리

> WASM 빌드는 Emscripten 툴체인이 필요합니다.
> (`sys/libnh/README.md` 참고)

### npm 패키지

WASM 빌드 후 `sys/lib/npm-library`에서 `npm publish`로 배포할 수 있습니다.
(현재 `.gitignore`에 `sys/lib/npm-package/build/` 등이 무시 처리됨)

## 4. 이 저장소의 WASM 흔적

현재 저장소에는 WASM 빌드의 흔적이 남아 있습니다.

- `targets/wasm/nethack.wasm`, `nethack.js` — 빌드 결과물
- `targets/wasm/wasm-data/` — 게임 데이터 (license, nhdat, logfile 등)
- `web/node_modules/three/` — 웹 3D 렌더링을 위한 three.js 의존성
  (WASM 웹 프론트엔드의 일부로 추정)

이들은 모두 `.gitignore`( `targets/*`, `bundle/*` 등)로 무시되어 실제 git에는
추적되지 않는 산출물입니다.

## 5. 새 플랫폼 포팅

최상위 `Porting` 파일에 새 플랫폼으로 포팅하는 가이드가 있습니다. 핵심 요건:

1. `sys/`에 OS 포팅 코드 작성 (`main`, 파일 I/O, 시간 등)
2. `win/`에 윈도우 포트 작성 (또는 기존 것 재사용)
3. hints 파일 작성하여 빌드 시스템에 연결

## 6. 정리

```
                    ┌─ sys/unix ────── Linux/macOS/BSD
                    ├─ sys/windows ─── Windows
                    ├─ sys/msdos ───── MS-DOS (크로스)
    src/ (코어) ────┼─ sys/amiga ───── AmigaOS
    win/ (UI)  ─────┤─ sys/vms ─────── OpenVMS
                    ├─ sys/libnh ───── 라이브러리 (a/js/wasm)
                    └─ sys/share ───── 공용 유틸
```
