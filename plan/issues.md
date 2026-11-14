# issues.md

구현 중 발견된 문제점을 기록한다.

작성 형식:

```
## I-XXX  <제목>
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
- 선택 이유: ...
```

- 사소하지 않고 **큰 작업이 필요한 문제**는 별도 문서 `issues-XX.md`로 분리해
  작업한다 (phase 규칙 준수).

## I-001  WASM 빌드가 polyself.c의 미사용 변수 때문에 -Werror로 실패
- 내용: `make CROSS_TO_WASM=1 all` 빌드가 `src/polyself.c:38-39`의 정적 변수
  `uasmon_generation_delta`, `largest_uasmon_generation_delta`가
  `UASMON_COUNTING_PER_MOVELOOP`가 정의되지 않아 미사용이 되어
  `-Wunused-variable`(→ `-Werror`)로 실패한다. (phase-02 작업과 무관한
  기존 코드, `3efc2bfc5`에서 도입된 것으로 보임)
- 대안:
  - A: 변수 선언을 `#ifdef UASMON_COUNTING_PER_MOVELOOP`로 감싼다. (선택)
  - B: WASM 빌드에서 `-Wno-unused-variable`을 추가한다.
  - C: 그대로 두고 `-Werror`를 제거한다.
- 선택 이유: A가 동작/수치 변경 없이 경고의 근본 원인(조건부로만 사용되는
  선언)을 제거한다. B/C는 빌드 경고를 전반적으로 약화시킨다.

<!-- 문제 항목은 작업을 진행하며 아래에 추가한다. -->

## I-002  벤더 Emscripten 글루 코드의 빌드 경고
- 내용: `frontend/src/runtime/nethack.js`(Emscripten 생성 파일)를 Vite로
  번들할 때 "direct eval 사용" 경고가 발생한다. Emscripten의
  `emscripten_run_script_*` 구현에 내장된 `eval()` 때문에 생기는 것으로,
  기능에는 영향이 없다.
- 대안:
  - A: Vite/Rollup `onwarn`에서 해당 파일 경고를 무시한다.
  - B: 그대로 두고 문서로 기록 (선택)
- 선택 이유: 경고가 벤더 생성 코드에 국한되고 기능에 무해하므로, phase 범위를
  지키기 위해 지금은 기록만 한다. 필요하면 후속 phase에서 억제한다.

## I-003  status 이벤트의 수치 필드 값이 정규화되지 않음
- 내용: `onStatus`의 `value`가 수치 필드(BL_STR 등)에서 실제 값이 아닌
  원시 포인터 주소처럼 보이는 값으로 읽힌다. `shim_status_update`의
  `ptr` 시맨틱(수치=값 포인터, 문자열=char*)을 정확히 매핑하지 못한 상태.
- 대안:
  - A: phase-07(ui)에서 필드 타입별로 정확히 매핑한다 (선택)
  - B: phase-03에서 즉시 수정
- 선택 이유: 이벤트 구조(field/chg/percent/color)와 분류는 이미 올바르고,
  값 해석은 UI가 스탯을 실제로 렌더링하는 phase-07에서 완성하는 게 자연스럽다.
