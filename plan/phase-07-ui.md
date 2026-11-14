# Phase 07 — ui

## 모듈
- 수정 대상 모듈: **`ui`** (단 하나)
- 수정 허용 위치: `frontend/src/ui/`
- 다른 모듈(`scaffold`, `core-api`, `runtime`, `assets`, `input`, `renderer`, `deploy`)과
  C 소스는 수정하지 않는다.

## 입력
- phase-03 (`runtime`): `onMessage`/`onStatus`/`onMenu`/`onYesNo` 이벤트,
  응답 API(`answerMenu`/`answerYesNo`/`replyString`), `sendCommand`,
  `isExplored`/`getHero`, `state.minimapOn`
- phase-04 (`assets`): `assets.playerPortrait()`

## 목표 (what)

오른쪽 **menu 패널**과 **미니맵**, 그리고 메뉴/선택 **오버레이**를 DOM으로
구현한다.

오른쪽 패널은 3단 구성:

1. **Player 패널**: 일러스트(`assets.playerPortrait()`) + 스탯
   (STR/DEX/CON/INT/WIS/CHA, HP/PW, AC, XP, 레벨, 골드 등) — `onStatus`로 갱신.
2. **액션 버튼**: Inventory / save / load / quit / **minimap on/off** 등.
   버튼은 대응 명령을 `runtime.sendCommand()`로 전달. minimap은
   `runtime.state.minimapOn`을 토글.
3. **이벤트 로그**: `onMessage`를 누적, **스크롤 가능**, 대화 포함.

오버레이:

- **메뉴**: `onMenu` 수신 시 메뉴를 오버레이로 표시, 선택을 `answerMenu`로 응답.
- **yes/no**: `onYesNo` 수신 시 표시, `answerYesNo`로 응답.
- **캐릭터 선택/시작 화면**도 동일한 오버레이 방식으로 처리.

미니맵:

- main(3D) 좌상단 오버레이. `runtime.state.minimapOn`이 true일 때 표시.
- **탐험(기억)한 맵**만 표시 (`isExplored`), 플레이어 위치/방향 + 계단/문 표시.

## 하면 안 되는 것 (what not)

- three.js 3D 렌더링을 하지 않는다 (renderer의 일). 미니맵은 2D(DOM/canvas)로.
- facing을 갱신하지 않는다 (input의 일).
- 게임 데이터를 변경하지 않는다.
- 런타임/에셋의 API를 변경하지 않는다.

## 산출물 (output)

- `frontend/src/ui/` 의 패널/로그/메뉴 오버레이/미니맵 코드
- `ui.init()` 로 패널과 오버레이가 부착되고 이벤트에 반응함
- 목표 레이아웃(왼쪽 3D + 오른쪽 3단 패널 + 좌상단 미니맵) 완성

## 다른 모듈에 제공하는 API (contract)

- 없음 (ui는 소비자). 오버레이 배치를 위해 renderer가 분리해 둔 컨테이너를
  사용한다.

## 완료 조건 (Definition of Done)

- [ ] Player 스탯/일러스트가 갱신된다
- [ ] 액션 버튼이 동작한다 (inventory/save/load/quit/minimap)
- [ ] 이벤트 로그가 누적되고 스크롤 가능하다
- [ ] 메뉴/yes-no/캐릭터 선택 오버레이가 동작한다
- [ ] 미니맵이 토글되고 탐험 맵을 표시한다
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-07-ui-start`
- 종료: `git tag phase-07-ui-end`
