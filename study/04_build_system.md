# 04. 빌드 시스템

NetHack 5.0은 "hints" 기반의 Makefile 생성 시스템을 사용합니다.
이 장에서는 빌드가 어떻게 구성되고 수행되는지 설명합니다.

## 1. 전체 개념

NetHack은 수십 개의 플랫폼/인터페이스 조합을 지원해야 하므로, 빌드 설정을
**Makefile 템플릿 + hints 조각**으로 분리했습니다.

```
sys/unix/Makefile.top    ─┐
sys/unix/Makefile.dat     │   (각각 템플릿)
sys/unix/Makefile.doc     │
sys/unix/Makefile.src     │
sys/unix/Makefile.utl     │
                          ├─ mkmkfile.sh 가 합쳐서 생성
sys/unix/hints/linux.501 ─┤
sys/unix/hints/include/  ─┘   (hints 조각들)
         │
         ▼
  (최상위) Makefile        ── 자동 생성됨 (직접 편집 금지)
  dat/Makefile
  doc/Makefile
  src/Makefile
  util/Makefile
```

핵심 원칙: **모든 Makefile은 자동 생성**되며, 직접 고치면 다음 설정 때
사라집니다. 손봐야 할 것은 Makefile이 아니라 **hints 파일**입니다.

## 2. 빌드 절차 (UNIX/Linux)

`sys/unix/NewInstall.unx`에 정리된 절차입니다.

### 1단계 — 설정 (Makefile 생성)

```sh
cd sys/unix
sh setup.sh hints/linux.501
cd ../..
```

`setup.sh`는 `mkmkfile.sh`를 호출하여 5개의 Makefile을 생성합니다:

| 생성되는 파일 | 태그 | 내용 |
|---------------|------|------|
| `Makefile` | TOP | 최상위 빌드 |
| `dat/Makefile` | DAT | 게임 데이터 |
| `doc/Makefile` | DOC | 문서 |
| `src/Makefile` | SRC | 게임 코어 컴파일 |
| `util/Makefile` | UTL | 유틸리티 |

### 2단계 — 컴파일

```sh
make all
```

### 3단계 — 설치

```sh
make install
```

> 주의: `make install`은 `nethackdir`(playground)을 삭제하고 새로 만듭니다.
> 기록(record), 로그, sysconf 파일을 보존하려면 미리 백업하세요.

### 초기화

빌드가 꼬였을 때 생성 파일을 모두 지우고 다시 시작:

```sh
make spotless
```

## 3. hints 파일

`sys/unix/hints/`에는 플랫폼별 hints 파일이 있습니다.

| 파일 | 대상 |
|------|------|
| `linux.501` | Linux |
| `macOS.501` | macOS |
| `bsd.501` | BSD 계열 |
| `linux-minimal` | 최소 Linux 빌드 |

`sys/unix/hints/include/`에는 hints 파일들이 공유하는 조각들이 있습니다.

- `dirs-perms.501` — 설치 경로/퍼미션
- `compiler.501` — 컴파일러 설정
- `multiw-*.501` — 다중 윈도우 인터페이스
- `multisnd-*.501` — 사운드
- `cross-*.501` — 크로스컴파일
- `response.501` — 응답 파일 사용

hints 파일 내부는 `#-INCLUDE` 지시어로 다른 조각을 끌어오며, Makefile의
"PRE/POST" 세그먼트가 삽입되는 방식으로 구성됩니다.

## 4. make 커맨드라인 옵션

빌드 동작을 제어하는 주요 변수들 (`sys/unix/README.hints` 정리):

### 윈도우 인터페이스 선택
```sh
make WANT_WIN_TTY=1        # tty (기본)
make WANT_WIN_CURSES=1     # curses
make WANT_WIN_X11=1        # X11
make WANT_WIN_QT6=1        # Qt6
make WANT_WIN_ALL=1        # 전부 (tty+curses+X11+Qt)
make WANT_DEFAULT=X11      # 기본 인터페이스 지정
make WANT_WINCHAIN=1       # WINCHAIN (인터페이스 연결)
```

### 라이브러리 / 크로스컴파일
```sh
make WANT_LIBNH=1          # libnethack.a 라이브러리 빌드
make CROSS_TO_WASM=1       # WASM(nethack.js/wasm) 크로스컴파일
make CROSS_TO_MSDOS=1 package   # MS-DOS 크로스컴파일
make CROSS_TO_MIPS=1       # MIPS 크로스컴파일
```

### 설치 / 기타
```sh
make WANT_SHARED_INSTALL=1 # 다중 사용자 공유 설치
make WANT_SOURCE_INSTALL=1 # 소스 트리 내 설치 (기본)
make WANT_ASAN=1           # AddressSanitizer
make WANT_UBSAN=1          # UndefinedBehaviorSanitizer
make musl=1                # musl libc 타깃
```

## 5. 빌드 산출물 흐름

빌드는 다음 순서로 산출물을 만들어 냅니다.

```
소스(src/*.c)
  → 컴파일 → src/*.o → src/hacklib.a  (게임 코어 라이브러리)

util/makedefs.c
  → 컴파일 → makedefs (게임 데이터 생성 도구)

dat/ 소스 데이터 (*.lua, *.txt)
  → makedefs 가 playground 데이터 생성 (dat/data, oracles, rumors ...)

윈도우 포트(win/*) + sys/*  → 최종 실행 바이너리 (nethack)
```

게임 실행 시 데이터 파일은 **playground** 디렉터리에 위치합니다
(Linux 소스 설치는 `./playground`).

## 6. DLB (Data LiBrary)

`dlb` 옵션을 켜면 playground에 흩어진 데이터 파일들을 하나의 컨테이너
파일로 묶을 수 있습니다. 관련 코드는 `src/dlb.c`, 도구는 `util/dlb_main.c`.
`Files` 문서 하단에 DLB 사용 시 파일이 달라진다는 주의가 있습니다.

## 7. 크로스컴파일 (개요)

5.0의 핵심 개선점 중 하나가 크로스컴파일입니다. 자세한 내용은 최상위
`Cross-compiling` 파일과 `07_platform_ports.md`에서 다룹니다.

요점: 빌드 머신(host)과 실행 머신(target)을 분리하여, 예를 들어 Linux에서
MS-DOS나 WASM 바이너리를 만들 수 있습니다.

## 8. Windows / VMS 빌드

- Windows: `sys/windows/` 아래에 `build-vs.txt`, `build-nmake.txt`,
  `build-msys2.txt` 등 툴체인별 지침이 있음. Visual Studio 솔루션은
  `sys/windows/vs/NetHack.sln`
- VMS: `sys/vms/` 아래 `Install501.vms`, `vmsbuild.com` 등

## 9. 처음 빌드해보기 (요약)

```sh
# 1. 의존성 (Ubuntu 기준, tty + X11 예시)
sudo apt install libncurses-dev libx11-dev libxt-dev libxaw7-dev

# 2. 설정
cd sys/unix
sh setup.sh hints/linux.501
cd ../..

# 3. 빌드 (tty만, 가장 단순)
make all

# 4. 설치
make install

# 5. 실행
./playground/nethack   # 또는 설치 위치의 nethack
```

문제가 생기면 `make spotless` 후 재시도하고, 그래도 안 되면
`sys/unix/Install.unx`의 전통 설정 방식을 참고합니다.
