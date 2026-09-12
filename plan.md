# NetHack 5.0 UI 모듈화 & Web 3D UI 지원 계획

> 목표: 기존 text UI(tty/curses)에 더해 **Web(GitHub Pages)에서 동작하는 3D UI**를
> 지원하고, 게임 세이브를 **압축 → text 인코딩(base64)** 방식으로 사용자에게
> 주고받는 구조를 만든다.

---

## 1. 현황 분석 (결론: UI는 이미 모듈화되어 있음)

NetHack은 오래전부터 **window port 추상화 계층**으로 UI가 분리되어 있고,
Web(WASM)로 내보내는 인프라와 헤드리스(shim) 포트가 **이미 커밋되어 있다**.
따라서 새로 모듈화할 필요는 없고, **기존 shim/WASM 파이프라인 위에 3D 프론트엔드와
세이브 문자열 직렬화만 얹으면 된다.**

### 1.1 Window Port 인터페이스

- `include/winprocs.h:26` — `struct window_procs`: 약 50개의 함수 포인터 집합.
  `win_init_nhwindows`, `win_putstr`, `win_print_glyph`, `win_nhgetch`,
  `win_start_menu`/`win_add_menu`/`win_select_menu`, `win_status_update`,
  `win_yn_function`, `win_getlin` 등이 전부 이 인터페이스로 정의된다.
- `include/winprocs.h:113` 이하 — `#define putstr (*windowprocs.win_putstr)` 같은
  매크로로 **엔진 코드는 `windowprocs` 전역 구조체를 통해 간접 호출**한다.
  (엔진 `src/*.c`는 어떤 UI가 붙는지 전혀 모른다.)
- `include/wintype.h` — `winid`, `ANY_P`(union any), `glyph_info`, `menu_item`,
  윈도우 타입(`NHW_MESSAGE/MAP/MENU/TEXT/STATUS`), 속성(`ATR_*`), 선택 타입
  (`PICK_NONE/ONE/ANY`) 정의.
- `doc/window.txt` — window port 구현자를 위한 공식 인터페이스 문서(권위 참고).

### 1.2 Window Port 등록/선택

- `src/windows.c:92` — `winchoices[]` 배열에 각 포트의 `struct window_procs` 포인터와
  `ini_routine`을 등록.
  `tty`/`curses`/`X11`/`Qt`/`mswin`/`shim` 등이 `#ifdef TTY_GRAPHICS` … `#ifdef
  SHIM_GRAPHICS` 로 조건 컴파일된다.
- `src/windows.c:266` — `choose_windows(name)`: `winchoices`를 순회해 이름이 일치하는
  포트의 `windowprocs`를 복사해 활성화. `DEFAULT_WINDOW_SYS`가 기본값.
- 즉 **새 UI를 추가하는 공식 경로 = `win/<name>/` 디렉토리 + `struct window_procs`
  구현 + `winchoices[]` 등록 + `#define <NAME>_GRAPHICS` + hints 설정.**

### 1.3 shim 포트 (Web/WASM의 기반) — 이미 존재

- `win/shim/winshim.c` — "가짜" 윈도 포트. 모든 window 콜을 **사용자 콜백**으로
  포워딩한다. 두 가지 백엔드:
  - **libnethack.a (네이티브)**: `shim_graphics_set_callback(shim_callback_t cb)`
    + `nhmain(argc, argv)`. 콜백 시그니처는 `(name, ret_ptr, fmt, ...)`.
  - **WASM/Emscripten**: `shim_graphics_set_callback(char *cbName)`으로 JS 함수 이름을
    등록하면, `win/shim/winshim.c:262`의 `local_callback`(EM_JS)이 Asyncify를 통해
    `globalThis[cbName](name, ...args)`를 호출하고 반환값을 WASM 메모리에 기록한다.
- `sys/libnh/README.md` — libnethack.a / nethack.js API 문서(호출 규약, 예제 포함).
- `sys/libnh/libnhmain.c` — `main()`(WASM용 `EMSCRIPTEN_KEEPALIVE`)/`nhmain()`
  (라이브러리용) 엔트리포인트.

### 1.4 WASM 빌드 파이프라인 — 이미 존재

- `sys/unix/hints/include/cross-pre2.500:307` — `CROSS_TO_WASM=1` 설정:
  `MODULARIZE`, `EXPORT_ES6=1`, `ASYNCIFY`, `IDBFS`, `--embed-file`로 dat 파일 내장.
  결과물 `nethack.js` / `nethack.wasm`.
- `sys/libnh/libnhmain.c`의 `js_helpers_init`(:846), `js_constants_init`(:985),
  `js_globals_init`(:1258) — JS 쪽에 **상수(glyph 오프셋, status 필드, 색/속성,
  조건 비트, 메뉴 선택 타입)와 가변 전역(flags 등)을
  `globalThis.nethackGlobal`에 노출**하는 기존 인프라.

### 1.5 렌더링 데이터 흐름

- 맵 렌더의 핵심은 `print_glyph(winid, x, y, glyph_info*, bkglyph_info*)`.
  `glyph_info`(include/wintype.h:104) = `glyph` 번호 + `ttychar` + 색.
- `win/share/tilemap.c` — glyph → 타일 인덱스 매핑(2D 타일셋용).
  → 3D에서는 이 매핑을 **glyph → 3D 모델/복셀**로 대체하면 된다.

### 1.6 세이브/로드 현황

- `src/save.c:74` — `dosave0()`: `create_savefile()` → `savelev()`/`savegamestate()`
  (레벨별 + 게임 상태를 `NHFILE*`로 직렬화) → `nh_compress()`.
- `src/restore.c` — `restore_saved_game()` → `dorecover()`.
- 압축: `src/files.c:1783` `nh_compress()` / :1832 `docompress_file()`.
  `include/config.h:380`의 `ZLIB_COMP`(내장 zlib) 또는 `COMPRESS`(외부 프로그램).
- **문제**: 현재 WASM에서는 세이브 파일이 Emscripten 가상 FS(MEMFS)에 기록되며,
  `IDBFS` 런타임 메서드가 export만 되어 있을 뿐(`cross-pre2.500`) **영구화
  (FS.mount/FS.syncfs) 배선이 없다.** → 리로드하면 세이브 유실. 그래서 "세이브를
  문자열로 추출/복원"하는 작업이 실제로 필요하다.

---

## 2. 목표 아키텍처

```
                    ┌─────────────────────────────────────────────┐
                    │  NetHack 엔진 (src/*.c) — UI 무관            │
                    └───────────────▲─────────────────────────────┘
                                    │ struct window_procs (매크로 호출)
                    ┌───────────────┴─────────────────────────────┐
                    │  window ports                                │
                    │  tty / curses / X11 / Qt / mswin / shim      │
                    └───────┬───────────────────────┬─────────────┘
                            │                       │
              (로컬 text UI 그대로)          shim → 콜백 (native / JS)
                                                    │
                                    ┌───────────────┴──────────────┐
                                    │  WASM: nethack.js/wasm        │
                                    │  globalThis.nethackGlobal     │
                                    └───────────────┬──────────────┘
                                                    │ shim 콜백 + FS
                                    ┌───────────────┴──────────────┐
                                    │  web/ 프론트엔드 (신규)        │
                                    │  - Three.js 3D 렌더러          │
                                    │  - 입력(키/마우스) → nhgetch 등 │
                                    │  - 세이브 문자열 추출/복원      │
                                    │  - GitHub Pages 정적 호스팅     │
                                    └───────────────────────────────┘
```

- **기존 text UI는 손대지 않는다.** tty/curses 빌드는 그대로 유지.
- 신규 작업은 (a) 웹 3D 프론트엔드, (b) 세이브 문자열 직렬화 API, (c) 빌드/배포 스크립트.

---

## 3. 작업 분해

### Phase 0 — 기준선 확보 (검증)

1. 로컬에서 WASM 빌드 확인:
   `make CROSS_TO_WASM=1 all` → `nethack.js`/`nethack.wasm` 생성 확인.
2. Emscripten 툴체인 설치/버전 고정 (README: `emscripten` SDK 필요).
3. 최소 JS 부트스트랩으로 shim 콜백 수신 확인(콘솔 로그 수준) — 기존
   `sys/libnh/README.md`의 `nethackStart()` 예제를 그대로 사용.

### Phase 1 — 웹 프론트엔드 골격 (`web/` 신규 디렉토리)

1. 디렉토리/모듈 구조:
   ```
   web/
     index.html            # GitHub Pages 진입점
     src/
       boot.js             # Emscripten Module 로드 + shim_graphics_set_callback
       renderer/           # Three.js 렌더러 (3D)
         scene.js, camera.js, glyph3d.js, tileset3d.js
       ui/                 # 메시지/상태/메뉴/다이얼로그 (2D 오버레이)
         message.js, status.js, menu.js, prompt.js
       input/              # 키보드/마우스 → nhgetch/yn_function/getlin
       save/               # 세이브 직렬화 (Phase 3)
     assets/               # 3D 모델/텍스처 (GLTF 또는 절차적 복셀)
     package.json          # 빌드/번들 (Vite 권장)
   ```
2. `boot.js`가 `shim_graphics_set_callback("nethackCallback")`을 호출하고,
   `globalThis.nethackCallback`이 **각 shim 콜백 name을 switch**로 분기 처리.
3. `nethackGlobal.constants`(이미 노출됨)를 활용해 glyph 오프셋/색/상태 필드를
   해석.

### Phase 2 — 3D 렌더러 (복셀 방식 확정)

1. **맵 렌더링**: `print_glyph` 콜백에서 받은 `glyph` 번호를
   `nethackGlobal.constants.GLYPH.*` 오프셋으로 분해(몬스터/오브젝트/지형/특수).
   → 각 셀을 **절차적 복셀(색 박스 기반)**으로 배치. `ttychar`는 ASCII 폴백용.
2. **지형/아이템 표현**: 절차적 복셀 + 색상. 벽/바닥/문/계단 등은 지형별 복셀
   패턴(높이/색)으로 구분. 아이템은 색 복셀 + 기호 빌보드.
3. **몬스터/플레이어**: glyph의 몬스터 인덱스로 식별. **몬스터 비주얼은 웹에 공개된
   데이터를 최대한 재사용** —
   - 기존 `win/share/monsters.txt`/`objects.txt`(glyph→타일/이름 매핑)와
     `win/share/`의 공개 타일셋(gif/png)을 **voxel 컬러 팔레트 및 형태 힌트**로 활용.
   - CC0/CC-BY 라이선스의 공개 복셀/스프라이트 에셋(OpenGameArt 등)을
     `web/assets/`에 정리해 `glyph → 에셋` 매핑 테이블로 연결.
   - 라이선스 준수를 위해 `web/assets/ATTRIBUTION.md`에 출처/라이선스 명시.
4. **카메라/조명**: 1인칭 또는 쿼터뷰. 시야(FOV)는 엔진이 이미 `print_glyph`로
   보이는 셀만 넘기므로 그대로 반영.
5. **상태/메시지 오버레이**: `status_update`(`BL_*` 필드) → HUD,
   `putstr`/`putmixed`(WIN_MESSAGE) → 로그 라인.

### Phase 3 — 세이브/로드 (text 인코딩 방식)

목표: **세이브 파일(압축본) → base64 문자열 → 사용자에게 제공(다운로드/복사/
localStorage)** 하고, **문자열 → 복호화 → FS에 기록 → 복원**.

1. **저장(export)**:
   - 세이브 완료 후(`dosave0` → `nh_compress` 이후), WASM 가상 FS에서 세이브
     파일 경로(`gs.SAVEF` + prefix, 압축 확장자)의 **바이트를 읽음**.
   - `FS.readFile(path)` → `Uint8Array` → base64 문자열.
   - 사용자 제공 매체(우선순위 확정):
     1. **다운로드 (기본)** — `Blob` + `<a download>`로 `.nhsave` 파일 저장.
     2. **클립보드** — 버튼/UI로 선택 시 base64 문자열 복사.
     (저장 UI에서 기본 다운로드 실행 + "클립보드로 복사" 버튼 제공)
   - 세이브가 압축본이면 그대로 base64(용량 최적). 미압축이면 필요 시 zlib로
     압축 후 base64 — WASM에 `zlib`가 링크되어 있으면 재사용 가능.
2. **불러오기(import)**:
   - base64 → `Uint8Array` → `FS.writeFile(path, bytes)`.
   - 이후 기존 복원 경로(`restore_saved_game` → `dorecover`)를 그대로 타도록
     `nhmain`에 `-u <name>` 재개 플래그를 넘기거나, 프론트가 복원 진입점을 호출.
   - 복원 실패 시(체크섬/버전 불일치) 원본 문자열을 유지한 채 오류 표시.
3. **엔진 측 지원(선택적, 권장)**:
   - `sys/libnh/libnhmain.c`에 `EMSCRIPTEN_KEEPALIVE` 함수 2개 추가하는 게 가장 깔끔:
     - `char *nethack_export_save(void)` — 세이브 파일 바이트를 읽어 base64 반환.
     - `int nethack_import_save(const char *b64)` — 디코딩해 FS에 기록 후 성공 여부.
   - base64 인코더/디코더는 Emscripten 내장 또는 JS 쪽(`btoa`/`atob`,
     바이너리 대응은 `Uint8Array` + 수동 인코딩)에서 처리.
   - 이렇게 하면 프론트가 FS 경로/확장자를 몰라도 되는 안정적 API가 됨.
4. **영구화(보너스)**: 문자열 방식과 별개로 `FS.mount(IDBFS, {}, '/save')` +
   `FS.syncfs`로 브라우저 내부 자동 저장도 병행 가능. (문자열 내보내기/가져오기가
   GitHub Pages에서 서버 없이 유일한 "외부 이동" 수단이라는 점은 변함없음.)

### Phase 4 — 입력 계층

- `shim_nhgetch` → `keydown` 매핑(ASCII + 화살표/기능키 → 엔진이 기대하는 값).
- `shim_yn_function`/`shim_getlin` → 2D 프롬프트/입력 박스.
- `shim_nh_poskey` → 마우스 클릭 좌표/버튼 매핑(맵 클릭 이동, 메뉴 클릭).
- `shim_start_menu`/`add_menu`/`select_menu` → HTML 오버레이 메뉴.
- `shim_player_selection` → 캐릭터 선택 화면.

### Phase 5 — 빌드/배포 (GitHub Pages) & 점수 저장

1. 빌드 스크립트: WASM 산출물 + dat 파일을 `web/`으로 복사, `vite build`로 번들.
2. GitHub Actions 워크플로(`.github/workflows/pages.yml`):
   - Emscripten 설치 → `make CROSS_TO_WASM=1` → 프론트 빌드 → `gh-pages` 브랜치 배포.
3. 정적 호스팅 한계 대응: 서버 없음 → 세이브는 Phase 3의 문자열 방식이 필수.
4. **오프라인 1인 플레이 전용**으로 확정. 멀티/실시간 서버는 고려하지 않음.
5. **점수 저장: 처음 구현에서는 제외(스코프 아웃).**
   - 이후 필요 시 동일 계정에 점수 전용 repository(`score.txt` 단일 파일)를 두고
     GitHub API 커밋 방식으로 추가하는 것은 검토 대상으로만 남겨둔다.

---

## 4. 세이브 직렬화 상세 설계

```
[저장]
dosave0() 완료 (압축된 세이브 파일 존재)
        │
        ▼
nethack_export_save(): FS.readFile(SAVEF 경로+확장자) → Uint8Array
        │
        ▼
base64 인코딩  ──►  사용자 (다운로드 / 클립보드 / localStorage)

[불러오기]
사용자가 base64 문자열 제공
        │
        ▼
nethack_import_save(b64): atob/decode → Uint8Array → FS.writeFile
        │
        ▼
기존 복원 경로 restore_saved_game() → dorecover()
```

- 압축은 **기존 `nh_compress`(ZLIB_COMP)** 결과물을 그대로 사용 → 문자열 길이 최소화.
- 메타데이터(플레이어명/레벨/버전/날짜)를 base64 앞에 짧은 헤더로 붙여
  로드 전 미리보기/검증에 사용(선택사항).
- `include/patchlevel.h`의 `EDITLEVEL` 검증은 엔진이 이미 수행. **버전이 다르면
  무조건 거부(Reject)**하고 "세이브 버전 불일치" 오류 문자열을 반환하며,
  원본 문자열은 삭제하지 않고 유지한다.

---

## 5. 주의/리스크

- **Asyncify 재진입**: `win/shim/winshim.c`의 주석이 경고하듯, 콜백 처리 중 재진입
  금지(`shimFunctionRunning` 가드). 3D 렌더/입력 콜백은 반드시 단일 진입점으로.
- **콜백 동기성**: `nhgetch`/`yn_function`/`select_menu` 등은 **블로킹**으로 반환값을
  기다린다(Asyncify가 스택을 풀어준다). 프론트는 각 호출에서 Promise를 반환해야 함
  (`sys/libnh/README.md`의 `userCallback(...).then(...)` 패턴 유지).
- **glyph 해석 버전 종속**: glyph 오프셋 상수는 `js_constants_init`이 런타임에
  노출하므로, 하드코딩 대신 `nethackGlobal.constants`를 읽을 것.
- **용량**: `--embed-file`로 dat 내장 → 초기 로드 크기 증가. 필요 시 lazy 로드/gzip
  전송(정적 호스팅 기본 압축) 고려.
- **멀티 윈도우/체인**: 본 계획은 shim 단일 포트 기준. 기존 `WINCHAIN`(chainin/
  chainout/trace)과의 공존은 확인 필요하나, WASM 경로는 shim 단독이므로 영향 없음.
- **text UI 회귀 없음**: tty/curses 빌드 경로를 건드리지 않아야 하며, 엔진 공통 코드
  변경은 `windowprocs` 인터페이스 뒤에 숨긴 채 최소화.

---

## 6. 산출물/변경 파일 예상

| 영역 | 파일 | 변경 |
|------|------|------|
| 신규 프론트 | `web/**` | 3D 렌더러 + UI + 입력 + 부트스트랩 |
| 신규 배포 | `.github/workflows/pages.yml` | CI 빌드/배포 |
| 세이브 API | `sys/libnh/libnhmain.c` | `nethack_export_save` / `nethack_import_save` |
| 세이브 API 선언 | `sys/libnh/README.md` | API 문서 갱신 |
| (선택) 빌드 | `sys/unix/hints/include/cross-pre2.500` | IDBFS 마운트/영구화 옵션 |
| (참고) | `doc/window.txt`, `include/winprocs.h` | 변경 불필요(기존 인터페이스 재사용) |

---

## 7. 검증

1. **text UI**: `make all`(tty) / `WANT_WIN_CURSES=1` 빌드·실행 정상(회귀 없음).
2. **WASM**: `make CROSS_TO_WASM=1` 산출물 로드, shim 콜백 수신 확인.
3. **3D**: 신규 게임 시작 → 맵 렌더 → 이동/공격/메뉴/상태 동작.
4. **세이브**: 저장 → base64 추출 → 새 탭/세션에서 문자열 복원 → 동일 상태 확인.
5. **GitHub Pages**: 배포된 URL에서 위 흐름 전부 동작.

---

## 8. 결정 사항 및 남은 질문

**확정된 결정:**
1. 3D 렌더: 절차적 **복셀** 방식. 몬스터/아이템 비주얼은 웹에 공개된 에셋(타일셋,
   CC 라이선스 복셀/스프라이트)을 최대한 재사용 + `glyph → 에셋` 매핑.
2. 세이브 이동 매체: **다운로드(기본) + 클립보드(UI 선택)**.
3. `EDITLEVEL` 버전 불일치 세이브: **거부**(원본 유지, 명확한 오류 표시).
4. 게임 형태: **오프라인 1인 플레이 전용**.
5. **점수 저장: 처음 구현에서는 제외.**
6. **에셋 라이선스: 원본 data의 라이선스를 그대로 승계.** 새 라이선스를 부여하지
   않고, 재사용하는 각 에셋의 원 라이선스를 그대로 준수한다.
   - NetHack 자체 타일셋(`win/share/*.txt`, 이미지) → **NGPL**(NetHack General
     Public License) 유지.
   - 제3자 에셋 → 각각의 원 라이선스(CC0/CC-BY 등)를 유지하고 요구되는
     attribution을 `web/assets/ATTRIBUTION.md`에 명시.

**남은 질문:**
- 없음. 설계 결정 완료.
