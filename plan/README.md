# NetHack 웹(3D 1인칭) 플레이어 — 계획 (모듈형)

> 목표: GitHub Pages에서 브라우저로 플레이 가능한 NetHack을,
> DOOM 스타일 1인칭 3D UI(three.js)로 만든다.

이 문서는 **조율(coordination) 문서**입니다. 실제 작업 지시는
`phase-*.md` 문서 하나하나가 **에이전트의 단독 입력 프롬프트**가 됩니다.

---

## 1. 설계 원칙

1. **모듈화**: 설계는 모듈 단위로 나뉘며, **한 모듈의 변경이 다른 모듈에
   영향을 주지 않아야 한다.**
2. **1 phase = 1 module**: 가능한 한 하나의 phase에서는 **하나의 모듈만**
   수정한다.
3. **phase = 프롬프트**: 각 phase 문서는 그 자체로 에이전트의 단독 입력이 된다.
   (입력/출력, what/what-not, 완료 조건, 모듈 간 API 계약 포함)
4. **what, not how**: phase 문서는 "무엇을 해야 하는지/하면 안 되는지"만
   기술하고, 구현 방식(how)은 에이전트가 판단한다.

## 2. 모듈 맵

| 모듈 | 책임 | 위치 (파일/디렉터리) |
|------|------|----------------------|
| `scaffold` | 프론트 프로젝트 골격, dev 빌드, 린트/테스트 설정 | `frontend/package.json`, `vite.config.*`, `index.html`, `src/main.js` |
| `core-api` | C 코어 데이터를 WASM으로 노출하는 접근자 | `sys/libnh/libnhmain.c`, `sys/unix/hints/include/cross-pre2.501` |
| `runtime` | WASM 로드 + shim 이벤트 브리지 + 타입화 데이터 API + 공유 상태 스토어 | `frontend/src/runtime/*` |
| `assets` | 일러스트/텍스처 로딩 + 몬스터·플레이어 매핑 테이블 | `frontend/src/assets/*` |
| `input` | 브라우저 입력 → 게임 명령/회전 인텐트 변환 | `frontend/src/input/*` |
| `renderer` | three.js 1인칭 3D 씬(지형/스프라이트/카메라) | `frontend/src/renderer/*` |
| `ui` | DOM 패널(스탯/액션/로그/메뉴 오버레이/미니맵) | `frontend/src/ui/*` |
| `deploy` | 프로덕션 번들 + GitHub Pages 배포 | CI 워크플로/배포 설정 |

> 모듈 간 의존은 **오직 문서에 명시된 API 계약**을 통해서만 이뤄진다.

## 3. Phase 목록 (의존 순서)

| Phase | 모듈 | 의존 |
|-------|------|------|
| [phase-01-scaffold.md](phase-01-scaffold.md) | `scaffold` | 없음 |
| [phase-02-core-api.md](phase-02-core-api.md) | `core-api` | 없음 (C 측) |
| [phase-03-runtime.md](phase-03-runtime.md) | `runtime` | 01, 02 |
| [phase-04-assets.md](phase-04-assets.md) | `assets` | 01 |
| [phase-05-input.md](phase-05-input.md) | `input` | 03 |
| [phase-06-renderer.md](phase-06-renderer.md) | `renderer` | 03, 04 |
| [phase-07-ui.md](phase-07-ui.md) | `ui` | 03, 04 |
| [phase-08-deploy.md](phase-08-deploy.md) | `deploy` | 01~07 |

## 4. 작업 규칙 · 결정 · 이슈 · 아카이브

- **문서 종류, phase/task 작성 방법, 태그/커밋 규칙, 품질 게이트, 결정/이슈
  기록 형식**은 모두 최상위 [AGENTS.md](../AGENTS.md)에 정의되어 있다.
- 결정은 [decision.md](decision.md), 발견된 문제는 [issues.md](issues.md)에 기록하고,
  완료된 작업 문서는 [archive/](archive/)로 이동한다.

## 5. 핵심 결정 요약 (상세는 decision.md)

- 렌더링: three.js / 완전 턴제 / libnh shim 확장
- facing: 렌더러(JS) 전용, 이동키=회전+전진, `Q`/`E`=45° 제자리 회전(턴 미소모)
- 몬스터·바닥 아이템: 2D 스프라이트(빌보드), 스택은 `m_at()` 최상위 정책
- 미니맵: 좌상단, 탐험 맵, 액션 메뉴 on/off
- 메뉴/캐릭터 선택: DOM 오버레이
- 시야 렌더링: 시야 내 지형 전체 생성 + 절두체 컬링
- 사운드: 고려 안 함

## 6. 화면 레이아웃 (참고)

```
+----------------+---+
|                | P |  P : Player 패널 (일러스트 + 스탯)
|   main (3D)    |---+
|   1인칭 시점    | A |  A : 액션 버튼 (Inventory/save/load/quit/minimap ...)
|   (좌상단 미니맵)|---+
|                | L |  L : 이벤트 로그 (대화 포함, 스크롤)
+----------------+---+
```
