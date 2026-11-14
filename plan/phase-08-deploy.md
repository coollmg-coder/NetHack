# Phase 08 — deploy

## 모듈
- 수정 대상 모듈: **`deploy`** (단 하나)
- 수정 허용 위치: 배포 관련 설정 (CI 워크플로, `frontend` 빌드 배포 설정 등)
- 다른 모듈(`scaffold`, `core-api`, `runtime`, `assets`, `input`, `renderer`, `ui`)의
  동작 코드와 C 소스는 수정하지 않는다. (빌드 설정과의 조정은 최소화)

## 입력
- phase-01~07 의 모든 산출물 (플레이 가능한 프론트엔드)
- WASM 산출물: `targets/wasm/nethack.js` + `nethack.wasm`

## 목표 (what)

브라우저에서 플레이 가능한 정적 산출물을 만들어 **GitHub Pages**에 배포한다.

- 프로덕션 번들 생성 (WASM/에셋/정적 파일 포함)
- GitHub Pages로 배포하는 파이프라인 (Actions 권장, 또는 `docs/` 등)
- 배포된 URL에서 게임이 실행되는 것 확인

## 하면 안 되는 것 (what not)

- 게임/렌더링/UI 기능을 변경하지 않는다 (배포/번들링에만 집중).
- WASM export/C 소스를 수정하지 않는다.
- 다른 모듈의 API를 변경하지 않는다.

## 산출물 (output)

- 프로덕션 빌드 + 배포 파이프라인
- GitHub Pages URL에서 플레이 가능

## 다른 모듈에 제공하는 API

- 없음.

## 완료 조건 (Definition of Done)

- [ ] 프로덕션 번들이 warning 없이 생성된다
- [ ] GitHub Pages 배포가 동작하고, URL에서 게임이 실행된다
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈의 기능을 변경하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-08-deploy-start`
- 종료: `git tag phase-08-deploy-end`
