# 08. 개발 워크플로우

NetHack 코드베이스에 기여하거나 수정할 때 알아야 할 개발 도구와 규칙을
정리합니다. 핵심 자료는 `DEVEL/Developer.txt`와 `DEVEL/code_style.txt`입니다.

## 1. 개발 문서 (`DEVEL/`)

| 파일 | 내용 |
|------|------|
| `Developer.txt` | 개발자 가이드 (git 설정, 훅, 변수 치환) |
| `code_style.txt` | 코딩 스타일 규칙 |
| `code_features.txt` | 코드 기능/플래그 정리 |
| `git_recipes.txt` | git 사용법 레시피 |
| `VERSION` | 개발 버전 히스토리 |
| `gitinfo.pl`, `nhgitset.pl` | git 설정 자동화 스크립트 |
| `hooksdir/` | git 훅 (커밋/체크아웃 시 동작) |
| `DOTGIT/TARGET` | 훅 관련 설정 파일 |

## 2. 코딩 스타일 핵심

`DEVEL/code_style.txt` 요약 (전체는 해당 파일 참고):

- **C99** 표준 (C++는 플랫폼 라이브러리 접근용으로만 일부 사용)
- 들여쓰기 **4칸 스페이스** (탭 금지)
- 한 줄 **최대 78자**
- ANSI 스타일 함수 선언/정의
- `staticfn` 매크로 사용
- 코드 포맷은 `.clang-format` 참고 (K&R 스타일 변형, 정기 사용은 아님)

## 3. 소스 파일 헤더

모든 소스 파일 상단에는 표준 헤더가 있습니다:

```c
/* $NHDT-Header: NetHack 5.0 allmain.c 2026/08/23_22:51:13 NetHack-5.0:1.309 $ */
/* Copyright (c) ... */
/* NetHack may be freely redistributed.  See license for details. */
```

- `$NHDT-Header:` 행은 git 변수 치환 시스템과 연동됨
- 파일명, 날짜, 리비전 번호가 자동으로 관리됨

## 4. git 저장소와 변수 치환

### 공개 저장소

- https://github.com/NetHack/NetHack
- https://sourceforge.net/p/nethack/NetHack/

### 변수 치환 (RCS/CVS 스타일)

NetHack은 git 커밋 시 `$NHDT-Date$`, `$NHDT-Branch$`, `$NHDT-Revision$` 같은
변수를 자동으로 치환하는 시스템을 사용합니다. 설정은 `.gitattributes`의
`NHSUBST` 속성으로 제어됩니다.

### nhadd / nhcommit

변수 치환을 하려면 일반 `git add`/`git commit` 대신 다음 별칭을 사용합니다.

```sh
git nhadd <filespec>
git nhcommit <filespec>
```

이들은 내부적으로 `nhsub`를 실행한 뒤 add/commit을 수행합니다. 자세한 내용은
`perldoc DEVEL/hooksdir/nhsub`.

### 초기 설정

```sh
perl DEVEL/nhgitset.pl
```

이 스크립트가 git 설정(`nethack.substprefix`, `nethack.gitadddir`)과
훅을 자동으로 설치합니다. 사용자 이름/이메일 등 기본 git 설정이 선행되어야
합니다. (`DEVEL/Developer.txt`의 4절 참고)

## 5. git 훅

`nhgitset.pl`이 설치하는 훅 (`DEVEL/hooksdir/`):

- `post-checkout`, `post-commit`, `post-merge`

이 훅들은 `dat/gitinfo.txt`를 생성하며, 이 데이터는 게임의 `#version` 명령과
`--version` 옵션에서 노출됩니다.

사용자 정의 훅은 `WHEN-HOOKNAME` 형식(`PRE-`, `POST-`)으로 추가할 수 있습니다.

## 6. 네이밍 예약 규칙

`/^nh/` 또는 `/^nethack/`과 일치하는 모든 이름(환경변수, 파일명, git config 등)은
예약되어 있습니다. 사용하지 마세요.

## 7. 버그 리포트 / 기여

- 버그: https://www.nethack.org/common/contact.html
- PR/제안 환영 (README, `Contributing.md` 참고)
- 버그 리포트에는 머신 타입, OS, 패치레벨, `#version` 출력을 포함

## 8. 테스트

Lua 기반 테스트가 `test/`에 있습니다 (`test/*.lua`). 실행 방법은
`test/README.md` 참고.

라이브러리/WASM 테스트는 `sys/libnh/test/`에 있습니다.

- `run.sh wasm` — nethack.js 재빌드
- `run.sh runwasm` — nethack.js 간단 테스트
- `run.sh lib` — libnethack.a 빌드
- `run.sh runlib` — libnethack.a 테스트

## 9. 개발 워크플로우 요약

```
1. git clone / 브랜치 생성 (LOCAL-* 접두사 권장)
2. perl DEVEL/nhgitset.pl            (1회 초기 설정)
3. 코드 수정 (code_style.txt 준수)
4. git nhadd <files>                 (변수 치환 + add)
5. git nhcommit <files>              (변수 치환 + commit)
6. 빌드/테스트 (04장, test/)
7. PR 또는 패치 제출
```
