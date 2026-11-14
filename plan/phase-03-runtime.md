# Phase 03 — runtime

## 모듈
- 수정 대상 모듈: **`runtime`** (단 하나)
- 수정 허용 위치: `frontend/src/runtime/` (및 이를 import하는 `frontend/src/main.js` 최소 배선)
- 다른 모듈(`scaffold`, `core-api`, `assets`, `input`, `renderer`, `ui`, `deploy`)과
  C 소스(`sys/`, `src/`)는 수정하지 않는다.

## 입력
- phase-01 (`scaffold`): `frontend/` 프로젝트 골격, `npm run dev`/`lint`/`test` 동작
- phase-02 (`core-api`): WASM export 접근자 + `nethackGlobal` 상수/전역
- WASM 산출물: `targets/wasm/nethack.js`(ES 모듈) + `nethack.wasm`

## 목표 (what)

WASM과 shim 콜백을 감싸, 나머지 JS 모듈(input/renderer/ui)이 **게임 상태를
타입화된 형태로 읽고, 명령을 보내고, 이벤트를 구독**할 수 있는 단일 진입점을
만든다. 이후 모듈은 WASM/shim을 직접 다루지 않는다.

- WASM 모듈 로드 + `shim_graphics_set_callback` 등록 (기존 shim 콜백)
- shim 윈도우 이벤트를 수신하여 **도메인 이벤트**로 분류/발행
- `core-api` 접근자를 감싼 데이터 조회 API 제공
- 게임에 명령(키)을 주입하는 API 제공
- 렌더러/UI가 공유하는 **상태 스토어** 제공 (facing, minimapOn 등)

## 하면 안 되는 것 (what not)

- 렌더링/입력/UI 자체를 구현하지 않는다 (각각 renderer/input/ui 모듈의 일).
- 게임 상태를 변형하지 않는다 (읽기 + 명령 주입만).
- C 소스를 수정하지 않는다. `core-api`가 노출하지 않은 데이터를 임의로
  (예: 구조체 오프셋 하드코딩 등으로) 읽지 않는다.
- shim 이벤트의 의미를 다른 모듈이 추측하게 만들지 않는다 (runtime이 정규화).

## 산출물 (output)

- `frontend/src/runtime/` 에 다음을 제공하는 코드
- `main.js`에서 `runtime.init()` 을 호출해 WASM이 로드되고 부팅되는 배선
- 간단한 검증: 콘솔/로그로 게임이 시작되고 shim 이벤트가 흐르는 것 확인

## 다른 모듈에 제공하는 API (contract)

`input`(05), `renderer`(06), `ui`(07)는 아래 API에만 의존한다.

```
runtime.init(): Promise<void>

// 데이터 조회
runtime.getTerrain(x, y) -> int        // S_* 지형 타입
runtime.isSeen(x, y)     -> boolean    // 현재 LOS 가시
runtime.isExplored(x, y) -> boolean    // 기억(탐험)
runtime.getHero()        -> { x:int, y:int }
runtime.getMonsters()    -> [ { x, y, type:int, color:int, visible:boolean }, ... ]
runtime.getItems()       -> [ { x, y, type:int, color:int }, ... ]  // 최상위 바닥 오브젝트
runtime.getTurn()        -> int

// 명령 주입
runtime.sendCommand(cmd: string): void   // NetHack 키(문자/확장명령)

// 이벤트 구독
runtime.onTurnChange(cb): unsubscribe    // 게임 상태(턴) 변경 시 호출
runtime.onMessage(cb)                    // 메시지 로그용
runtime.onStatus(cb)                     // 스탯/상태 갱신용
runtime.onMenu(cb)                       // 메뉴 표시 요청
runtime.onYesNo(cb)                      // yes/no 질문
// 위 on* 이벤트에 대응하는 응답 함수
runtime.answerMenu(index)                // 메뉴 선택 응답
runtime.answerYesNo(ch)                  // yes/no 응답
runtime.replyString(s)                   // 문자열 입력 응답

// 공유 상태 스토어 (렌더러/UI/input이 읽고 씀)
runtime.state.get(key) / .set(key, value) / .on(key, cb)
// key: "facing"(int 0..7), "minimapOn"(boolean)
```

## 완료 조건 (Definition of Done)

- [ ] `npm run dev` 로 WASM이 로드되고 게임이 시작된다
- [ ] shim 이벤트가 도메인 이벤트로 분류되어 발행되는 것이 확인된다
- [ ] `runtime`의 조회 API가 실제 게임 상태를 반환한다 (스모크 확인)
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈(renderer/ui/input)을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-03-runtime-start`
- 종료: `git tag phase-03-runtime-end`
