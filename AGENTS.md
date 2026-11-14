# AGENTS.md

이 파일은 이 저장소에서 작업하는 에이전트(및 사람)가 지켜야 할 **문서 종류와
작성 방법, 작업 규칙**을 정한다.

## 프로젝트 개요

NetHack 5.0 기반, GitHub Pages에서 브라우저로 플레이 가능한 **1인칭 3D UI**를
만드는 프로젝트. 계획은 `plan/` 디렉터리에 모듈형으로 관리한다.

## 설계 원칙

1. **모듈화**: 한 모듈의 변경이 다른 모듈에 영향을 주지 않아야 한다.
2. **1 phase = 1 module**: 가능한 한 하나의 phase에서 하나의 모듈만 수정한다.
3. **phase = 프롬프트**: phase 문서는 그 자체로 에이전트의 단독 입력이 된다.
4. **what, not how**: "무엇을 할지/하지 말지"만 기술하고 구현 방식은 판단에 맡긴다.

---

## 1. 문서 종류와 용도

| 파일 | 용도 |
|------|------|
| `plan/README.md` | 조율/인덱스 문서. 모듈 맵, phase 목록, 화면 레이아웃, 목표 |
| `plan/phase-XX-name.md` | phase 지시서 = 에이전트 단독 입력 프롬프트 |
| `plan/phase-XX-name-task-YY-name.md` | phase를 나눈 하위 task 지시서 |
| `plan/decision.md` | 작업 중 내린 모든 결정 기록 |
| `plan/issues.md` | 구현 중 발견된 문제점 기록 |
| `plan/issues-XX.md` | 큰 작업이 필요한 문제의 전용 작업 문서 |
| `plan/archive/` | **완료된** 작업 문서를 이동하는 곳 |

## 2. phase 문서 작성 방법

각 `phase-*.md`는 아래 항목을 포함한다.

```markdown
# Phase XX — name

## 모듈
- 수정 대상 모듈(단 하나)과 수정 허용/금지 파일 범위

## 입력
- 의존하는 phase/산출물/전제

## 목표 (what)
- 달성해야 할 것 (구현이 아니라 "무엇"을 이룰지)

## 하면 안 되는 것 (what not)
- 범위 밖의 행위 명시

## 산출물 (output)
- 완료 시 존재해야 하는 것

## 다른 모듈에 제공하는 API (contract)   # 의존 관계가 있는 경우
- 모듈 간 계약(시그니처/시맨틱) 명시

## 완료 조건 (Definition of Done)
- 체크리스트

## 태그
- 시작/종료 태그 이름
```

- phase가 크면 **task 문서**로 나눌 수 있다. task 문서도 위 규칙을 동일하게
  따른다.
- 모듈 간 의존은 **문서에 명시된 API 계약**을 통해서만 이뤄진다.

## 3. 태그 규칙

- phase **시작 시** 태그를 찍는다. (완료 시 종료 태그도 찍는다.)
- phase/task/issue 정보는 **태그에만** 담는다 (커밋 메시지에는 담지 않는다).

```
# phase
git tag phase-XX-<name>-start
git tag phase-XX-<name>-end

# task
git tag phase-XX-<name>-task-YY-<taskname>-start / -end

# 큰 이슈
git tag issue-XX-<name>-start / -end
```

## 4. 커밋 규칙

- phase 종료 시 **의미 단위**로 커밋을 완료한다 (논리적 변경 하나 = 커밋 하나).
- 커밋 제목/본문에는 **문서·phase·task·issue 참조를 넣지 않는다.**
  - 금지 예: `"phase-03 ..."`, `"plan.md 참고"`, `"fix #42"`, `"closes #..."`
  - 허용 예: `"add level map accessor exports"`
- 커밋 메시지는 코드 변경 자체를 서술한다.

## 5. 품질 게이트

모든 phase 완료 시 다음이 **없어야** 한다.

- [ ] 테스트 실패
- [ ] lint error
- [ ] lint warning
- [ ] 컴파일/빌드 warning

## 6. decision.md 작성 형식

작업 중 내린 결정(사용자·에이전트 모두)을 기록한다.

```
## D-XXX  <제목>
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
  - C: ...
- 선택 이유: ...
```

## 7. issues.md / issues-XX.md 작성 형식

구현 중 발견된 문제점을 기록한다.

```
## I-XXX  <제목>
- 내용: ...
- 대안:
  - A: ... (선택)
  - B: ...
- 선택 이유: ...
```

- 사소하지 않고 **큰 작업이 필요한 문제**는 `issues-XX.md` 별도 문서를 만들어
  작업한다 (위 phase 규칙 준수).
- **완료된** phase/task 문서는 `plan/archive/`로 이동한다.

## 8. 기타

- 이 프로젝트의 기존 NetHack 코딩 스타일은 `DEVEL/code_style.txt`를 따른다.
- `sys/libnh`, `win/shim` 등 WASM 관련 기존 인프라를 재사용한다.
