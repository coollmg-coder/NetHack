# decision.md

작업 중 내린 결정(사용자·에이전트 모두)을 기록한다.

작성 형식:

```
## D-XXX  <제목>
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
  - C: ...
- 선택 이유: ...
```

<!-- 결정 항목은 작업을 진행하며 아래에 추가한다. -->

## D-001  런타임 지도 열거를 위해 COLNO/ROWNO 상수 추가
- 내용: phase-03(runtime)에서 `getMonsters()`/`getItems()`가 전체 지도를
  순회하려면 지도 크기(COLNO/ROWNO)가 JS에 필요했다. phase-02(core-api)에서
  노출하지 않았던 것을 발견해, `js_constants_init()`에 `MAP` 스코프로
  `COLNO`/`ROWNO` 상수를 추가했다.
- 대안:
  - A: core-api 상수에 `MAP`(COLNO/ROWNO) 추가 (선택)
  - B: JS에서 80×21을 하드코딩 (매직 넘버)
  - C: C 접근자 함수를 추가해 지도 크기를 반환
- 선택 이유: A가 가장 명시적이고 재사용 가능하며, 하드코딩(B)의 취약성을
  피한다. C는 A와 동일한 C 파일 수정인데 상수 노출 체계를 재사용하는 A가
  더 간결하다.

## D-002  Emscripten MODULARIZE는 `noInitialRun`을 명시해야 함
- 내용: `createModule()`이 내부적으로 `run()`에서 `callMain()`을 자동 호출한다.
  콜백 등록 전에 main이 실행되어(콜백 미등록 → shim 함수가 기본값 반환 →
  동기 무한 루프) 브라우저 탭이 충돌했다. `noInitialRun: true`로 자동 실행을
  막고, 콜백 등록 후 명시적으로 `main`을 호출하도록 수정했다.
- 대안:
  - A: `noInitialRun: true` 후 명시적 main 호출 (선택)
  - B: 콜백을 먼저 등록하고 자동 실행을 활용
- 선택 이유: A가 로드 순서(콜백 등록 → 게임 시작)를 명확히 보장한다.
  B는 factory가 반환되기 전에 콜백을 등록해야 해서 제어가 어렵다.

## D-003  phase-07에서 runtime에 2건의 정당한 변경 적용
- 내용: UI가 스탯/텍스트 입력을 처리하려면 runtime의 버그 수정과 소규모 API
  추가가 필요했다. (1) `readStatusValue`가 모든 status 필드를 문자열로
  정규화하도록 수정(I-003 해결), (2) `replyString`을 쓸 수 있도록 `onGetLine`
  이벤트를 공개 API에 추가.
- 대안:
  - A: runtime을 수정한다 (선택)
  - B: phase-07(ui)에서 우회/하드코딩
- 선택 이유: status 값 추출과 이벤트 노출은 runtime의 정규화/브리지 책임이므로
  runtime에서 수정하는 게 맞다. API 시그니처는 기존 계약을 유지하고 추가만
  했다.

## D-004  I-005 해결: menu_list 채우는 C 헬퍼 + 캐릭터 선택 활성화
- 내용: I-005(select_menu menu_list 미충전) 해결을 위해 core-api에
  `nh_populate_menu_list()` C 헬퍼를 추가하고, runtime이 add_menu에서
  식별자(anything 첫 4바이트)를 보관해 select_menu에서 menu_list를 채우도록
  했다. 동시에 `shim_player_selection_or_tty`를 `true`로 바꿔 캐릭터 선택
  메뉴가 표시되도록 했다.
- 대안:
  - A: C 헬퍼가 struct 레이아웃을 책임 (선택)
  - B: JS에서 메모리 레이아웃을 직접 계산
- 선택 이유: struct 크기/오프셋은 C에 맡기는 게 안전하다. 캐릭터 선택은
  웹 UI에서도 본래 제공해야 할 기능이므로 활성화가 맞다.

## D-000  (예시 템플릿)
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
- 선택 이유: ...
