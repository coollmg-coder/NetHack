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
