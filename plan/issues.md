# issues.md

구현 중 발견된 문제점을 기록한다.

작성 형식:

```
## I-XXX  <제목>
- 상태: 해결됨 / 열림
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
- 선택 이유: ...
```

- 사소하지 않고 **큰 작업이 필요한 문제**는 별도 문서 `issues-XX.md`로 분리해
  작업한다 (phase 규칙 준수).

---

## I-001  WASM 빌드가 polyself.c의 미사용 변수 때문에 -Werror로 실패
- 상태: 해결됨 (phase-02에서 수정, `0b95a83c8`)
- 내용: `make CROSS_TO_WASM=1 all` 빌드가 `src/polyself.c:38-39`의 정적 변수
  `uasmon_generation_delta`, `largest_uasmon_generation_delta`가
  `UASMON_COUNTING_PER_MOVELOOP`가 정의되지 않아 미사용이 되어
  `-Wunused-variable`(→ `-Werror`)로 실패했다.
- 대안:
  - A: 변수 선언을 `#ifdef UASMON_COUNTING_PER_MOVELOOP`로 감싼다. (선택)
  - B: WASM 빌드에서 `-Wno-unused-variable`을 추가한다.
  - C: 그대로 두고 `-Werror`를 제거한다.
- 선택 이유: A가 동작/수치 변경 없이 경고의 근본 원인을 제거한다. B/C는
  빌드 경고를 전반적으로 약화시킨다.

## I-003  status 이벤트의 수치 필드 값이 정규화되지 않음
- 상태: 해결됨 (phase-07에서 수정, `521765c53`)
- 내용: `onStatus`의 `value`가 수치 필드에서 원시 주소처럼 읽혔다.
  `shim_status_update`의 `ptr`은 BL_CONDITION을 제외한 모든 필드에서
  문자열(`curr->val`)이라는 점을 반영해 runtime의 `readStatusValue`를
  `UTF8ToString(ptr)`으로 수정했다.
- 대안:
  - A: runtime에서 `UTF8ToString(ptr)`으로 통일 (선택)
  - B: phase-07(ui)에서 필드 타입별로 매핑
- 선택 이유: 값 추출은 runtime의 정규화 책임이므로 runtime에서 고치는 게 맞다.

---

## I-002  벤더 Emscripten 글루 코드의 빌드 경고
- 상태: 열림 (기능 무해)
- 내용: `frontend/src/runtime/nethack.js`(Emscripten 생성 파일)를 Vite로
  번들할 때 "direct eval 사용" 경고가 발생한다. Emscripten의
  `emscripten_run_script_*` 구현에 내장된 `eval()` 때문에 생긴다.
- 대안:
  - A: Vite/Rollup `onwarn`에서 해당 파일 경고를 무시한다.
  - B: 그대로 두고 문서로 기록 (선택)
- 선택 이유: 경고가 벤더 생성 코드에 국한되고 무해하다. 필요하면 후속
  phase에서 억제한다.

## I-004  three.js 번들로 인한 chunk 크기 빌드 경고
- 상태: 열림 (기능 무해)
- 내용: three.js import로 번들이 ~651KB(미니파이)가 되어 Vite/Rolldown의
  500KB chunk 크기 경고가 발생한다. 3D 게임에서 정상 크기(gzip ~164KB).
- 대안:
  - A: `chunkSizeWarningLimit`을 올리거나 코드 분할 (배포 phase에서 처리)
  - B: 그대로 두고 문서로 기록 (선택)
- 선택 이유: 경고가 실질 문제가 아니고, 코드 분할은 배포/최적화 단계에서
  다룰 일이다.

## I-005  select_menu의 menu_list 출력이 채워지지 않음
- 상태: 열림 (실질 제한 — 캐릭터/메뉴 선택 정확도)
- 내용: shim의 `select_menu`는 반환값(선택 개수)만 JS로 전달되고, 선택된
  항목 식별자를 담는 `menu_list` 출력 포인터는 채워지지 않는다. 따라서
  PICK_ONE 메뉴에서 특정 항목을 선택해도 호출자가 `selected[0].item`을
  정상적으로 읽지 못한다. 현재는 반환 0이 "취소/랜덤"으로 처리되어 게임은
  진행되지만, 정확한 항목 선택은 동작하지 않는다.
- 대안:
  - A: shim select_menu가 menu_list를 WASM 메모리에 채우도록 확장 (선택)
  - B: 반환값만으로 동작하도록 우회
- 선택 이유: 근본 해결은 shim/core-api 범위(WASM 메모리 구조 작성)가 필요해
  phase-07 범위를 벗어난다. 후속 phase에서 A를 진행한다.

<!-- 새 이슈는 이 아래에 추가한다. -->
