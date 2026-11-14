# Phase 05 — input

## 모듈
- 수정 대상 모듈: **`input`** (단 하나)
- 수정 허용 위치: `frontend/src/input/` (및 이를 배선하는 `main.js` 최소 수정)
- 다른 모듈(`scaffold`, `core-api`, `runtime`, `assets`, `renderer`, `ui`, `deploy`)과
  C 소스는 수정하지 않는다.

## 입력
- phase-03 (`runtime`): `runtime.sendCommand()`, `runtime.state` (특히 `facing`)

## 목표 (what)

브라우저 입력(키보드/포인터)을 게임 명령과 회전 인텐트로 변환한다.

- **이동(8방향)**: 이동 명령을 `runtime.sendCommand()`로 전달하면서, 해당 방향을
  `runtime.state.facing` 에 반영 (이동 = 회전 + 전진).
- **`Q`/`E`**: 게임 명령을 보내지 **않고** `runtime.state.facing`만 45° 회전
  (제자리 회전, 턴 미소모). facing은 0..7 (0=북, 45° 간격) 규칙.
- **기타 키**: NetHack 명령 키(문자/확장명령)를 `runtime.sendCommand()`로 전달.
- 브라우저 키(화살표/hjkl/기타) → NetHack 방향/명령 키로의 매핑.

## 하면 안 되는 것 (what not)

- facing을 C 코어나 WASM에 저장하지 않는다 (JS 전용).
- 렌더링을 하지 않는다 (renderer의 일). facing 값만 갱신한다.
- UI 패널(버튼/로그/메뉴)을 구현하지 않는다 (ui의 일).
- 키 매핑 외에 게임 상태를 변경하지 않는다.

## 산출물 (output)

- `frontend/src/input/` 의 입력 처리 코드
- `input.attach()` 로 브라우저 이벤트가 게임/회전 인텐트로 연결됨

## 다른 모듈에 제공하는 API (contract)

- `renderer`/`ui`는 이 모듈을 직접 호출하지 않는다. 대신 `runtime.state.facing` 을
  읽는다. 즉 이 모듈의 유일한 부수효과는 `runtime.sendCommand()` 호출과
  `runtime.state.facing` 갱신이다.

## 완료 조건 (Definition of Done)

- [ ] 이동키가 이동 명령 + facing 갱신을 동시에 수행한다
- [ ] `Q`/`E`가 게임 명령 없이 facing만 45° 회전시킨다
- [ ] 기타 명령 키가 게임에 전달된다
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-05-input-start`
- 종료: `git tag phase-05-input-end`
