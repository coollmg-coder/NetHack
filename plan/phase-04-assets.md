# Phase 04 — assets

## 모듈
- 수정 대상 모듈: **`assets`** (단 하나)
- 수정 허용 위치: `frontend/src/assets/` (이미지/텍스처 파일 및 매핑 코드)
- 다른 모듈(`scaffold`, `core-api`, `runtime`, `input`, `renderer`, `ui`, `deploy`)과
  C 소스는 수정하지 않는다.

## 입력
- phase-01 (`scaffold`): `frontend/` 프로젝트 골격 (에셋 import가 가능해야 함)
- 에셋 소스: 기존 NetHack 타일/아트 + 공개 일러스트 (개인 사용, 라이선스 비민감)

## 목표 (what)

몬스터·바닥 오브젝트·플레이어 일러스트·지형 텍스처를 로드하고, 게임의 정수
식별자(종류/색)를 실제 에셋에 매핑하는 계층을 만든다.

- 에셋 로딩(텍스처/이미지) 기능
- **몬스터 매핑 테이블**: 몬스터 종류(type) → 일러스트. 아종/변이는 **색(hue
  shift) 또는 크기**로 구분할 수 있는 정보 제공
- **바닥 오브젝트 매핑 테이블**: 오브젝트 종류(type) → 이미지
- **플레이어 일러스트 매핑 테이블**: role/race(또는 gender) → 초상화 일러스트
- **지형 매핑**: 지형 타입(`S_*`) → 벽/바닥 텍스처

> 이 phase는 "어떤 이미지를 쓸지"를 고르고, 식별자→에셋 매핑을 제공하는 데
> 초점을 둔다. 실제 three.js 렌더링은 `renderer` 모듈이 한다.

## 하면 안 되는 것 (what not)

- three.js로 직접 렌더링하지 않는다 (renderer의 일).
- 렌더러/UI에 매핑 테이블을 하드코딩해 노출시키지 않는다 (assets API로만 제공).
- 매핑 정책(예: 아종=색 vs 크기)을 다른 모듈이 판단하게 만들지 않는다.
- WASM/runtime/입력을 건드리지 않는다.

## 산출물 (output)

- `frontend/src/assets/` 의 로더 + 매핑 테이블 + 실제 이미지/텍스처 파일
- 다음 API를 구현

## 다른 모듈에 제공하는 API (contract)

`renderer`(06), `ui`(07)가 사용한다.

```
assets.load(): Promise<void>                    // 에셋 사전 로드

assets.monster(type:int, color:int) -> {
    sprite,        // 몬스터 이미지/텍스처
    scale,         // 크기 배율 (아종 구분)
    hue            // 색상 보정 (아종 구분)
}
assets.item(type:int, color:int) -> { sprite, scale, hue }
assets.playerPortrait(role, race) -> image      // 플레이어 초상화
assets.terrain(type:int) -> { wall?: texture, floor?: texture }
```

## 완료 조건 (Definition of Done)

- [ ] 몬스터/오브젝트/플레이어/지형 매핑이 식별자로 조회 가능하다
- [ ] 에셋 로딩이 실패하지 않는다 (누락/경로 오류 없음)
- [ ] 테스트 실패 없음, lint error/warning 없음, 빌드 warning 없음
- [ ] 다른 모듈을 수정하지 않았다
- [ ] 의미 단위로 커밋 완료, 커밋 메시지에 문서/phase/task/issue 참조 없음

## 태그
- 시작: `git tag phase-04-assets-start`
- 종료: `git tag phase-04-assets-end`
