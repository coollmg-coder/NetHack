# Phase 02 — core-api

## 모듈
- 수정 대상 모듈: **`core-api`** (단 하나)
- 수정 허용 파일:
  - `sys/libnh/libnhmain.c` (Emscripten export/접근자 추가)
  - `sys/unix/hints/include/cross-pre2.501` (EXPORTED_FUNCTIONS 등 링크 설정)
- 다른 모듈(`scaffold`, `runtime`, `assets`, `input`, `renderer`, `ui`, `deploy`)과
  `src/`, `win/` 게임 로직은 수정하지 않는다.

## 입력
- 없음 (독립). 단, 다음이 이미 존재함을 전제:
  - `sys/libnh/libnhmain.c` 의 기존 `nethackGlobal`/`EM_JS`/`SET_CONSTANT`/`CREATE_GLOBAL` 체계
  - `win/shim/winshim.c` 의 shim 콜백
  - WASM 빌드 동작 (`make CROSS_TO_WASM=1 all`)

## 목표 (what)

렌더러가 필요로 하는 **게임 상태를 JS에서 읽을 수 있게** 하는 C 접근자 함수를
추가하고, WASM에서 호출 가능하도록 export 한다.

아래 데이터를 JS가 (직·간접으로) 조회할 수 있어야 한다. **어떻게 구현하는지는
자유**이나, JS-facing 시맨틱 계약은 아래와 같다.

- 지형: 현재 레벨의 `(x, y)` 타일 지형 구분.
  - `include/rm.h` 의 `S_*` 상수(S_stone, S_room, S_corr, S_door, S_wall 등)가
    JS에서 식별 가능해야 한다.
- 시야: `(x, y)` 가 **현재 LOS 내에서 보이는지** 여부.
- 탐험: `(x, y)` 가 **기억(탐험)된 타일인지** 여부.
- 영웅 위치: 플레이어의 현재 `(x, y)`.
- 몬스터: 현재 레벨의 몬스터 목록. **타일당 최상위 몬스터 1마리**
  (`m_at(x,y)` = `svl.level.monsters[x][y]` 정책). 각 항목은 좌표/종류/색/가시성.
- 바닥 오브젝트: 타일당 최상위 바닥 오브젝트 1개 (좌표/종류/색).
- 턴: 현재 턴 카운터, 그리고 "상태가 바뀌었음"을 렌더러가 알 수 있는 신호.

> 종류(type)·색(color)은 렌더러가 에셋 매핑에 쓰는 정수 식별자면 충분하다.
> 상수(지형/색)를 JS에 노출할 때는 기존 `nethackGlobal.constants` 체계를 활용할 수 있다.

## 하면 안 되는 것 (what not)

- 게임 로직(`src/`, `win/`)의 동작/수치를 변경하지 않는다 (오직 **읽기** 접근).
- facing/카메라/미니맵 등 렌더러 개념을 C에 도입하지 않는다.
- shim 콜백 인터페이스(`win/shim/winshim.c`)의 기존 동작을 깨뜨리지 않는다.
- JS 측(`frontend/`) 코드를 작성하지 않는다 (이 phase는 C 측만).
- 시각/성능 최적화를 위해 게임 상태를 변형하지 않는다.

## 산출물 (output)

- C 접근자 함수 + WASM export 목록 갱신
- JS에서 위 데이터를 조회 가능해짐 (검증은 다음 phase에서 `runtime`을 통해)
- `make CROSS_TO_WASM=1 all` 이 warning 없이 성공하고, export가 유지됨

## 다른 모듈에 제공하는 API (contract)

`runtime` 모듈(phase-03)이 이 phase의 산출물을 감싸서 아래 형태로 노출할 수 있어야
한다. 즉, C 측에서 **아래를 충족할 데이터/함수를 제공**해야 한다.

```
terrain(x, y)  -> int   # S_* 지형 타입
isSeen(x, y)   -> bool  # 현재 LOS 내 가시
isExplored(x, y)-> bool # 기억(탐험) 여부
hero()         -> { x:int, y:int }
monsters()     -> [ { x:int, y:int, type:int, color:int, visible:bool }, ... ]
items()        -> [ { x:int, y:int, type:int, color:int }, ... ]   # 최상위 바닥 오브젝트
turn()         -> int
# 상태 변경 통지 신호 (shim 콜백의 지도 갱신 이벤트로 충분해도 됨)
```

## 완료 조건 (Definition of Done)

- [ ] `make CROSS_TO_WASM=1 all` 이 컴파일/링크 **warning 없이** 성공한다
- [ ] export 함수가 의도대로 유지된다 (`EXPORTED_FUNCTIONS` 검증)
- [ ] 테스트 실패 없음, lint error/warning 없음
- [ ] 게임 로직/동작에 영향이 없음 (읽기 전용)
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-02-core-api-start`
- 종료: `git tag phase-02-core-api-end`
