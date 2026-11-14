# Phase 06 — renderer

## 모듈
- 수정 대상 모듈: **`renderer`** (단 하나)
- 수정 허용 위치: `frontend/src/renderer/`
- 다른 모듈(`scaffold`, `core-api`, `runtime`, `assets`, `input`, `ui`, `deploy`)과
  C 소스는 수정하지 않는다.

## 입력
- phase-03 (`runtime`): 데이터 조회 API + `runtime.state.facing` + `onTurnChange`
- phase-04 (`assets`): `assets.monster()`, `assets.item()`, `assets.terrain()`

## 목표 (what)

three.js로 **1인칭 3D 화면**을 그린다. (화면 레이아웃의 왼쪽 main 영역)

- **카메라**: `runtime.getHero()` 위치에, `runtime.state.facing` 방향을 바라보게 배치.
- **지형**: 시야 내 보이는 타일(`isSeen`)을 셀로 렌더. 바닥 quad + 인접 타일이
  통행 불가/비가시이면 벽 quad. 지형 텍스처는 `assets.terrain()` 사용.
- **몬스터**: `runtime.getMonsters()`를 2D 스프라이트(빌보드, 항상 카메라 정면)로
  타일 중앙에 배치. 타일당 최상위 1마리. `assets.monster()`로 이미지/색/크기 결정.
- **바닥 오브젝트**: `runtime.getItems()`도 2D 스프라이트로 렌더.
- **갱신**: `runtime.onTurnChange` 시 재렌더.
- **시야 정책**: 시야 내 지형을 생성하고, 카메라 절두체 컬링으로 자연 처리.

## 하면 안 되는 것 (what not)

- UI 패널(스탯/액션/로그/메뉴)과 **미니맵**을 구현하지 않는다 (ui의 일).
- facing을 갱신하지 않는다 (input의 일). 읽기만 한다.
- 게임 데이터를 변경하지 않는다.
- 런타임/에셋의 API를 변경하지 않는다.

## 산출물 (output)

- `frontend/src/renderer/` 의 three.js 씬/카메라/지형/스프라이트 코드
- `renderer.init(container)` 및 갱신 진입점
- 왼쪽 main 영역에 1인칭 3D 화면이 표시됨

## 다른 모듈에 제공하는 API (contract)

- 주로 **없음** (렌더러는 소비자). 다만 `ui`가 미니맵 좌상단 오버레이를 배치할
  수 있도록, 렌더러는 main 컨테이너와 오버레이 컨테이너를 명확히 분리해 둔다.

## 완료 조건 (Definition of Done)

- [ ] 1인칭 시점으로 보이는 지형이 렌더된다
- [ ] 이동/회전 시 카메라와 시점이 정확히 갱신된다
- [ ] 몬스터/바닥 오브젝트가 스프라이트로 표시된다
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-06-renderer-start`
- 종료: `git tag phase-06-renderer-end`
