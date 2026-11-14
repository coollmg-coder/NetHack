# Phase 01 — scaffold

## 모듈
- 수정 대상 모듈: **`scaffold`** (단 하나)
- 이 phase에서 다른 모듈(`core-api`, `runtime`, `assets`, `input`, `renderer`, `ui`, `deploy`)의
  파일을 수정하거나 생성하지 않는다.

## 입력
- 없음 (이 phase는 다른 phase에 의존하지 않는다)
- 단, WASM 산출물이 이미 존재함을 전제: `targets/wasm/nethack.js` + `nethack.wasm`
  (`make CROSS_TO_WASM=1 all` 로 생성, ES 모듈 `EXPORT_ES6` + `MODULARIZE`)

## 목표 (what)

`frontend/` 디렉터리에 웹 프론트엔드의 **프로젝트 골격**을 만든다.

- `frontend/package.json` — 의존성 선언 (three, vite, ESLint 등)
- 개발 빌드/서버 도구 구성 (예: vite). `npm run dev` 로 로컬 서버가 뜨고,
  빈 페이지가 렌더되어야 한다.
- `frontend/index.html` — 화면 셸. **추후 확장을 위한 빈 컨테이너** 구조만:
  - 왼쪽: 3D main 영역을 담을 컨테이너 (미니맵 오버레이 자리는 비워둠)
  - 오른쪽: menu 패널을 담을 컨테이너 (상단 Player / 중단 액션 / 하단 로그 3분할)
- `frontend/src/main.js` — 엔트리 포인트 골격. 아직 WASM을 로드하지 않아도 된다.
- 린트 설정(ESLint)과 그 실행 스크립트(`npm run lint`), 테스트 러너 실행 스크립트를
  마련한다 (테스트는 아직 1건도 없어도 통과해야 한다).
- 모듈 디렉터리 골격을 미리 만든다 (`runtime/`, `assets/`, `input/`, `renderer/`,
  `ui/` 는 빈 상태로 두거나, 각각의 공개 API 파일을 비워둔다).

## 하면 안 되는 것 (what not)

- WASM을 로드하거나 shim 콜백을 등록하지 않는다 (이것은 `runtime` 모듈의 일).
- 게임 데이터/렌더링/입력/UI 로직을 구현하지 않는다.
- 다른 모듈의 API를 정의·변경하지 않는다.
- C 소스(`sys/`, `src/`)를 수정하지 않는다.
- `core-api`의 export 함수 목록을 바꾸지 않는다.

## 산출물 (output)

- `frontend/package.json`, 빌드/서버/린트/테스트 구성 파일
- `frontend/index.html` (셸)
- `frontend/src/main.js` 및 빈 모듈 디렉터리 골격
- `npm run dev` 동작 확인, `npm run lint` 통과, `npm test` 통과(테스트 0건)

## 다른 모듈에 제공하는 API

- 없음. 다만 이후 phase들이 사용할 **파일 위치 규칙**을 확정한다:
  - 런타임: `frontend/src/runtime/`
  - 입력: `frontend/src/input/`
  - 렌더러: `frontend/src/renderer/`
  - UI: `frontend/src/ui/`
  - 에셋: `frontend/src/assets/`

## 완료 조건 (Definition of Done)

- [ ] `npm run dev` 로 빈 페이지가 로컬에서 뜬다
- [ ] `npm run lint` 가 error/warning **없이** 통과한다
- [ ] `npm test` 가 실패 없이 통과한다
- [ ] 빌드 시 warning 이 없다
- [ ] 이 phase 범위 밖의 파일(다른 모듈/C 소스)을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-01-scaffold-start`
- 종료: `git tag phase-01-scaffold-end`
