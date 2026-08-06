# 로그인 입력값 검증/오류 처리 및 로그인 가드 설계 (IH2-54, IH2-58)

- 대상 저장소: `hisfrontend`(FE) / `admin-service`(BE, auth 도메인)
- 대상 브랜치: FE `feature/front-management/ih2-5-login`, BE `feature/auth/IH2-5-login` (기존 로그인 브랜치 재사용, `develop` 최신화 후 이어서 작업)
- 범위 티켓: IH2-54(로그인 입력값 검증 및 오류 처리), IH2-58(권한 정보 로딩 및 초기 접근 제어 — "로그인 가드 + 사용자 정보 로딩"으로 범위 축소)

## 배경

로그인/로그아웃(IH2-53, 55, 61, 60, 59)은 이미 구현되어 `develop`에 있다. 남은 IH2-5 하위 티켓 중 IH2-54, IH2-58을 진행한다.

- IH2-54: FE에는 로그인 폼 클라이언트 검증이 전혀 없고, BE는 검증 로직(빈값/미존재/잠금/비밀번호불일치/휴직상태)은 있지만 전부 `IllegalArgumentException`으로 던져 `GlobalExceptionHandler`의 catch-all(`Exception`) 브랜치로 빠져 **HTTP 500 + 클래스명 노출**로 처리되고 있다. `ErrorCode`도 `ADM004` 하나뿐이다.
- IH2-58: `fetchAuthMeRequest/Success/Failure` 액션과 saga는 이미 구현되어 있지만 아무도 dispatch하지 않는다. `AppFrame.tsx`는 `/login` 여부만 pathname으로 구분할 뿐 실제 인증 확인이 없다("인증 가드는 추후 복구" 주석). 권한/역할 모델은 프로젝트 전체에 존재하지 않아, 이번 범위는 세션 기반 로그인 가드 + 이미 있는 `AuthUser` 정보 로딩까지로 한정한다. 메뉴별/역할별 접근 제어, BE 인가(Security 필터체인 등)는 별도 티켓으로 분리.

## 1. IH2-58 — 로그인 가드 + 사용자 정보 로딩 (FE only)

`src/components/layout/AppFrame.tsx` 수정:

- `/login`이 아닌 경로 최초 진입 시 1회만 `dispatch(fetchAuthMeRequest())` (`useRef`로 중복 방지). 이미 `state.auth.user`가 있으면(로그인 직후 리다이렉트) 재호출하지 않음
- 렌더링 3분기:
  - **확인 중**(user 없음 + loading 또는 아직 me 체크 전) → 로딩 표시 (보호된 화면이 잠깐이라도 보이지 않도록)
  - **인증됨**(`state.auth.user` 있음) → 기존처럼 `AppShell` 렌더
  - **미인증**(체크 끝났는데 user 없음/실패) → `router.replace("/login")`
- `/login` 경로는 기존과 동일하게 `children`만 반환(가드 없음)

## 2. IH2-54 — 로그인 입력값 검증 및 오류 처리 (FE + BE)

### FE — `src/components/auth/LoginForm.tsx`

- `onSubmit`에서 아이디/비밀번호를 trim 후 빈 값이면 API 호출 없이 필드별 인라인 에러(`fieldErrors: { loginId?: string; password?: string }`)만 표시하고 종료
- 인라인 에러는 각 `FormField`의 `Input` 아래에 작은 텍스트로 표시(개발표준가이드 §15.3 "인라인 검증은 필드별로" 원칙)
- 서버 에러(`state.auth.error`, 상단 `Alert`)는 기존 로직 그대로 유지

### BE — `AuthServiceImpl.java` + `ErrorCode.java` + `GlobalExceptionHandler.java`

`ErrorCode`에 3개 신규 추가 (기존 검증 4곳 중 메시지가 겹치는 3곳을 하나로 묶음, 메시지/조건은 기존과 동일하게 유지):

| 코드 | HTTP | 메시지 | 적용 위치 |
|---|---|---|---|
| `ADM005` | 400 | 아이디와 비밀번호를 입력하세요. | 빈 값 |
| `ADM006` | 401 | 아이디 또는 비밀번호가 올바르지 않습니다. | 계정 미존재 / 비밀번호 불일치 / 휴직 상태 (3곳, 계정 존재 여부 비노출 유지) |
| `ADM007` | 401 | 잠긴 계정입니다. 관리자에게 문의하세요. | `lockedAt != null` |

`AuthServiceImpl.login()`의 4개 `throw new IllegalArgumentException(...)`을 `throw new BusinessException(ErrorCode.XXX)`로 교체. 조건/순서/사용자 노출 메시지는 변경하지 않는다. `failCount` 기반 자동 잠금 로직은 이번 범위에 포함하지 않는다.

**버그 수정**: `GlobalExceptionHandler.handleBusiness()`가 현재 `ApiResponse.of(status, errorCode.getCode(), null)`로 **코드 문자열**("ADM006")을 message 자리에 넣고 있어 FE에 실제 한글 메시지가 아니라 코드가 그대로 노출된다. `errorCode.getMessage()`로 수정.

## 에러 처리 흐름 정리

- 빈 값: FE에서 API 호출 전에 차단 (BE `ADM005`는 API를 우회해 직접 호출하는 경우의 방어선)
- 그 외 서버 검증 실패: BE `BusinessException` → `GlobalExceptionHandler` → `{code: 400|401, message: "<실제 메시지>"}` → FE axios interceptor가 `Error(message)`로 변환 → saga가 `fetchAuthLoginFailure`로 put → `LoginForm`의 상단 `Alert`에 표시 (기존 흐름 그대로, BE 배관만 고침)

## 테스트

- FE: 빈 아이디/비밀번호로 제출 시 API 호출 없이 인라인 에러 표시 확인. `/admin/emp` 등 보호 경로를 로그아웃 상태에서 직접 URL 접근 시 `/login`으로 리다이렉트되는지 확인. 새로고침 시(세션 쿠키 있는 상태) 잠깐의 로딩 후 정상 진입되는지 확인.
- BE: curl로 빈 값/잘못된 비밀번호/잠긴 계정 각각 호출해 `{code, message}`가 실제 한글 메시지로 오는지, HTTP 상태가 500이 아닌 400/401인지 확인.

## 범위 밖

- 역할/권한 기반 메뉴 필터링, BE 인가(Security 필터체인/인터셉터), `failCount` 자동 잠금 로직 — 별도 티켓
