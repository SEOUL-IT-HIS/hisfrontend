# 로그아웃 기능 설계 (IH2-6)

- 대상 저장소: `hisfrontend`(FE) / `admin-service`(BE, auth 도메인)
- 대상 브랜치: FE `feature/front-management/ih2-6-logout`, BE `feature/auth/IH2-6-logout`
- 범위 티켓: IH2-61(로그아웃 처리), IH2-60(세션 또는 토큰 무효화), IH2-59(로그아웃 후 클라이언트 상태 초기화)
- 제외 티켓: IH2-62(로그아웃 후 접근 차단 및 재인증 유도) — 별도 작업으로 분리

## 배경

로그인 기능(IH2-5)이 이미 FE/BE `develop`에 병합되어 있고, 다음이 이미 구현된 상태다.

- BE: `AuthController` — `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`(`session.invalidate()` 호출, 세션 기반 인증, `SESSION_USER_KEY`)
- FE: `src/features/auth/` — `authApi.ts`(`fetchAuthLogoutApi`), `authSlice.ts`(`fetchAuthLogout{Request,Success,Failure}` 리듀서), `authSaga.ts`(`fetchAuthLogoutSaga`: API 호출 → `localStorage.removeItem("userInfo")` → success put), `LoginForm.tsx`(요청 dispatch 후 `waitRedirect` ref + `useEffect`로 결과 감시하는 패턴)

빠진 것은 이 기능을 실제로 실행하는 UI와, 로그아웃 후 클라이언트 상태를 완전히 비우는 처리뿐이다.

## 1. IH2-61 — 로그아웃 처리 (FE)

- `src/components/sidebar/Sidebar.tsx` footer("환경설정" 버튼 옆)에 "로그아웃" 버튼 추가
- 버튼 클릭 → 기존 공통 `ConfirmDialog`로 "정말 로그아웃하시겠습니까?" 확인
- 확인 시 `dispatch(fetchAuthLogoutRequest())` — 기존 `fetchAuthLogoutSaga` 그대로 사용(수정 없음)
- `LoginForm.tsx`의 `waitRedirect` ref + `useEffect` 패턴을 동일하게 적용해 `state.auth.{loading,error,user}` 변화를 감시:
  - 성공(`error === null && user === null`) → 3번의 `logoutReset()` dispatch → `router.replace("/login")`
  - 실패(`error` 존재) → 기존 `Alert` 컴포넌트로 인라인 에러 표시(LoginForm과 동일 방식, 별도 Toast 없음)
- Sidebar가 현재 순수 presentational 컴포넌트라 `useDispatch`/`useSelector`가 이번에 처음 들어가지만, LoginForm과 동일한 패턴이라 컨벤션 이탈 아님

## 2. IH2-60 — 세션/토큰 무효화 (BE)

- `AuthController.logout()`이 이미 `session.invalidate()`를 호출 중 → **추가 코드 불필요**
- 검증만 진행: 로그아웃 후 `GET /api/auth/me` 재호출 시 세션이 없다는 응답(현재 `ApiResponse.error(400, "로그인이 필요합니다.")`)이 오는지 확인

## 3. IH2-59 — 클라이언트 상태 초기화 (FE)

동일 티켓 번호로 재작성 이전 커밋(`6ad067f`)에 이미 구현됐던 방식을 그대로 재사용한다.

- `src/features/auth/logoutReset.ts` 신규 생성: `LOGOUT_RESET` 액션 타입 상수 + `logoutReset()` 액션 크리에이터
- `src/store/rootReducer.ts`(리드 전용 파일 — PR에서 리드 승인 필요) 수정: `action.type === LOGOUT_RESET`이면 `appReducer(undefined, action)`으로 전체 Redux 상태를 초기 상태로 리셋
- 1번의 로그아웃 성공 처리 흐름에서 `logoutReset()`을 dispatch(리다이렉트 직전)

## 에러 처리

- FE: `fetchAuthLogoutFailure`의 `error` 메시지를 `Alert`로 인라인 표시 (개발표준가이드의 "raw alert() 금지, Toast 사용" 원칙과 완전히 일치하진 않지만, 현재 코드베이스에 Toast 인프라가 없고 LoginForm도 동일하게 인라인 `Alert`를 쓰고 있어 기존 패턴을 따름)
- BE: 별도 `ErrorCode`/`BusinessException` 신규 추가 없음 (로그인 관련 `ADM005`~`ADM008` 정비는 이번 티켓 범위 밖)

## 테스트

- FE: Sidebar 로그아웃 버튼 클릭 → 확인 다이얼로그 → 확인 시 API 호출 → 성공 시 `/login` 리다이렉트 및 Redux 상태 초기화 확인. API 실패 시 에러 메시지 노출 확인.
- BE: `POST /api/auth/logout` 호출 후 세션 무효화 확인(`GET /api/auth/me`가 실패 응답 반환하는지).

## 범위 밖 (참고)

- IH2-62(로그아웃 후 접근 차단 및 재인증 유도): `AppFrame.tsx`의 인증 가드 복구, axios 401 처리, BE `/api/**` 세션 체크 인터셉터 신설 여부 등은 이번 작업에 포함하지 않음. 별도 티켓/설계로 진행.
