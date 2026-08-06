# 로그인 검증/오류처리 및 로그인가드(IH2-54, IH2-58) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 폼에 클라이언트 입력값 검증을 추가하고, BE 로그인 검증 실패가 HTTP 500으로 새지 않고 올바른 코드/메시지로 응답하게 고친 뒤(IH2-54), 보호된 화면에 진입할 때 세션을 확인해서 미인증이면 `/login`으로 보내는 가드를 추가한다(IH2-58).

**Architecture:** BE는 기존 `AuthServiceImpl`의 검증 조건/메시지를 그대로 유지한 채 예외 타입만 `BusinessException`+신규 `ErrorCode`로 교체하고, `GlobalExceptionHandler`의 메시지 노출 버그를 고친다. FE는 `LoginForm`에 제출 전 필드 검증을 추가하고, `AppFrame`에 이미 구현되어 있던 `fetchAuthMeRequest`를 실제로 dispatch하는 가드 로직을 붙인다.

**Tech Stack:** Next.js(App Router)/React 19/Redux Toolkit+redux-saga/TypeScript (FE), Spring Boot/Gradle (BE).

## Global Constraints

- 참고 설계 문서: [docs/superpowers/specs/2026-08-06-login-validation-guard-design.md](../specs/2026-08-06-login-validation-guard-design.md)
- 범위: IH2-54(FE 검증 + BE 오류처리), IH2-58(로그인 가드 + 사용자 정보 로딩만). 역할/권한 모델, BE 인가(Security), `failCount` 자동잠금은 범위 밖.
- BE 검증 조건/순서/사용자 노출 메시지는 그대로 유지한다. 예외 타입(플러밍)만 바꾼다.
- 두 저장소 모두 자동화 테스트 러너가 없다. FE는 `npm run lint`+`npx tsc --noEmit`+브라우저 수동 확인, BE는 `./gradlew compileJava`+`curl` 수동 확인으로 검증한다.
- 서버는 사용자가 로컬에서 직접 기동한다 (에이전트가 기동하지 않음). curl 검증은 이미 떠 있는 서버에 대해서만 수행한다.
- 커밋 메시지 형식: `IH2-XX 1. 설명 기능추가|기능수정`.

---

## File Structure

- Modify (BE): `src/main/java/kr/co/seoulit/his/adminservice/common/exception/ErrorCode.java` — `ADM005`/`ADM006`/`ADM007` 추가
- Modify (BE): `src/main/java/kr/co/seoulit/his/adminservice/common/exception/GlobalExceptionHandler.java` — `handleBusiness()` 메시지 버그 수정
- Modify (BE): `src/main/java/kr/co/seoulit/his/adminservice/auth/service/impl/AuthServiceImpl.java` — `IllegalArgumentException` → `BusinessException` 교체
- Modify (FE): `src/components/auth/LoginForm.tsx` — 제출 전 필드 검증 + 인라인 에러
- Modify (FE): `src/components/layout/AppFrame.tsx` — 로그인 가드(`fetchAuthMeRequest` 연결)

---

### Task 1: BE `ErrorCode` 추가 + `GlobalExceptionHandler` 메시지 버그 수정

**Files:**
- Modify: `src/main/java/kr/co/seoulit/his/adminservice/common/exception/ErrorCode.java` (전체 23줄)
- Modify: `src/main/java/kr/co/seoulit/his/adminservice/common/exception/GlobalExceptionHandler.java:16-22`

**Interfaces:**
- Produces: `ErrorCode.AUTH_LOGIN_FIELD_REQUIRED`, `ErrorCode.AUTH_INVALID_CREDENTIALS`, `ErrorCode.AUTH_ACCOUNT_LOCKED` — Task 2(`AuthServiceImpl`)에서 사용.

- [ ] **Step 1: `ErrorCode.java`에 3개 상수 추가**

```java
package kr.co.seoulit.his.adminservice.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * admin-service 메시지 코드 (개발표준가이드 15.2)
 * 서비스 코드 ADM + 일련번호 3자리
 *
 * 담당 영역(auth/employee/commoncode/system) 초기화 — 재구현 시 코드 추가
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "ADM004", "요청 값이 올바르지 않습니다."),
    AUTH_LOGIN_FIELD_REQUIRED(HttpStatus.BAD_REQUEST, "ADM005", "아이디와 비밀번호를 입력하세요."),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "ADM006", "아이디 또는 비밀번호가 올바르지 않습니다."),
    AUTH_ACCOUNT_LOCKED(HttpStatus.UNAUTHORIZED, "ADM007", "잠긴 계정입니다. 관리자에게 문의하세요.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
```

- [ ] **Step 2: `GlobalExceptionHandler.handleBusiness()`의 메시지 버그 수정**

`errorCode.getCode()`(코드 문자열)를 message 자리에 넣고 있던 것을 `errorCode.getMessage()`(실제 한글 메시지)로 교체:

```java
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.of(errorCode.getHttpStatus().value(), errorCode.getMessage(), null));
    }
```

(파일의 나머지 부분 — `handleValidation`, `handleUnexpected` — 은 그대로 둔다.)

- [ ] **Step 3: 컴파일 확인**

Run: `./gradlew compileJava --console=plain`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add src/main/java/kr/co/seoulit/his/adminservice/common/exception/ErrorCode.java src/main/java/kr/co/seoulit/his/adminservice/common/exception/GlobalExceptionHandler.java
git commit -m "IH2-54 1. 로그인 오류코드(ADM005~007) 추가 및 BusinessException 메시지 노출 버그 수정 기능수정"
```

---

### Task 2: BE `AuthServiceImpl` — `IllegalArgumentException` → `BusinessException` 교체

**Files:**
- Modify: `src/main/java/kr/co/seoulit/his/adminservice/auth/service/impl/AuthServiceImpl.java` (전체 65줄)

**Interfaces:**
- Consumes: `ErrorCode.AUTH_LOGIN_FIELD_REQUIRED/AUTH_INVALID_CREDENTIALS/AUTH_ACCOUNT_LOCKED` (Task 1), `BusinessException` (기존 클래스)

- [ ] **Step 1: `AuthServiceImpl.java` 전체를 아래로 교체**

검증 조건/순서는 절대 바꾸지 않는다. `throw new IllegalArgumentException("...")` 4곳만 `throw new BusinessException(ErrorCode.XXX)`로 바꾼다.

```java
package kr.co.seoulit.his.adminservice.auth.service.impl;

import kr.co.seoulit.his.adminservice.auth.dto.AuthDto;
import kr.co.seoulit.his.adminservice.auth.dto.AuthRequestDto;
import kr.co.seoulit.his.adminservice.auth.entity.AuthEntity;
import kr.co.seoulit.his.adminservice.auth.mapper.AuthMapper;
import kr.co.seoulit.his.adminservice.auth.repository.AuthRepository;
import kr.co.seoulit.his.adminservice.auth.service.AuthService;
import kr.co.seoulit.his.adminservice.common.exception.BusinessException;
import kr.co.seoulit.his.adminservice.common.exception.ErrorCode;
import kr.co.seoulit.his.adminservice.emp.entity.EmpEntity;
import kr.co.seoulit.his.adminservice.emp.repository.EmpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * [ServiceImpl] 로그인 검증
 * - ACCOUNT: loginId / pwHash 확인
 * - EMPLOYEE: 재직(01) 확인 후 응답 DTO 구성
 *
 * 참고: 직원등록 시 비밀번호 입력 없음 → 현재는 PW_HASH 평문 비교
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    /** EMP_STATUS_CD — 재직 */
    private static final String EMP_STATUS_ACTIVE = "01";

    private final AuthRepository authRepository;
    private final EmpRepository empRepository;
    private final AuthMapper authMapper;

    @Override
    public AuthDto login(AuthRequestDto request) {
        if (!StringUtils.hasText(request.getLoginId()) || !StringUtils.hasText(request.getPassword())) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FIELD_REQUIRED);
        }

        String loginId = request.getLoginId().trim();

        AuthEntity account = authRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (account.getLockedAt() != null) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_LOCKED);
        }

        // 직원등록 과정에 비밀번호 입력 없음 → 당분간 평문 비교
        if (!request.getPassword().equals(account.getPwHash())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        EmpEntity emp = empRepository.findById(account.getEmpId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS));

        if (!EMP_STATUS_ACTIVE.equals(emp.getEmpStatus())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        return authMapper.toAuthDto(account, emp);
    }
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `./gradlew compileJava --console=plain`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: curl로 검증 (사용자가 이미 띄워둔 로컬 서버 대상, 8080 포트)**

```bash
# 1) 빈 값 -> 400 ADM005
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"loginId":"","password":""}'
# Expected: {"code":400,"message":"아이디와 비밀번호를 입력하세요.","data":null}

# 2) 존재하지 않는 아이디 -> 401 ADM006
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"loginId":"no_such_user","password":"x"}'
# Expected: {"code":401,"message":"아이디 또는 비밀번호가 올바르지 않습니다.","data":null}

# 3) 존재하는 아이디 + 틀린 비밀번호 -> 401 ADM006 (테스트 계정으로 교체)
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"loginId":"admin","password":"wrong-password"}'
# Expected: {"code":401,"message":"아이디 또는 비밀번호가 올바르지 않습니다.","data":null}
```

세 응답 모두 `message`가 실제 한글 문장으로 오고(코드 문자열 아님), HTTP 상태가 500이 아니면 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/main/java/kr/co/seoulit/his/adminservice/auth/service/impl/AuthServiceImpl.java
git commit -m "IH2-54 1. AuthServiceImpl 로그인 검증 예외를 BusinessException/ErrorCode 기반으로 교체 기능수정"
```

---

### Task 3: FE `LoginForm` 제출 전 필드 검증

**Files:**
- Modify: `src/components/auth/LoginForm.tsx` (전체 116줄)

**Interfaces:**
- Consumes: 기존 `fetchAuthLoginRequest`, `Alert`/`FormField`/`Input`/`Button` (변경 없음)
- Produces: 없음 (leaf 컴포넌트)

- [ ] **Step 1: `fieldErrors` state 추가 (기존 `form` state 아래)**

```tsx
  const [form, setForm] = useState<LoginFormState>({
    loginId: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    loginId?: string;
    password?: string;
  }>({});
```

- [ ] **Step 2: `onSubmit`을 검증 로직 포함하도록 교체**

```tsx
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const loginId = form.loginId.trim();
    const password = form.password.trim();
    const nextFieldErrors: { loginId?: string; password?: string } = {};
    if (!loginId) nextFieldErrors.loginId = "아이디를 입력하세요.";
    if (!password) nextFieldErrors.password = "비밀번호를 입력하세요.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});

    waitRedirect.current = true;
    dispatch(fetchAuthLoginRequest({ loginId, password }));
  }
```

- [ ] **Step 3: 아이디/비밀번호 `FormField` 안에 인라인 에러 추가, 입력 시 해당 필드 에러 초기화**

```tsx
        <FormField label="아이디" required htmlFor="loginId">
          <Input
            id="loginId"
            value={form.loginId}
            placeholder="로그인 아이디"
            autoComplete="username"
            disabled={loading}
            onChange={(e) => {
              setForm({ ...form, loginId: e.target.value });
              setFieldErrors((prev) => ({ ...prev, loginId: undefined }));
            }}
          />
          {fieldErrors.loginId ? (
            <span className="text-xs text-rose-500">{fieldErrors.loginId}</span>
          ) : null}
        </FormField>

        <FormField label="비밀번호" required htmlFor="password">
          <Input
            id="password"
            type="password"
            value={form.password}
            placeholder="비밀번호"
            autoComplete="current-password"
            disabled={loading}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          {fieldErrors.password ? (
            <span className="text-xs text-rose-500">{fieldErrors.password}</span>
          ) : null}
        </FormField>
```

- [ ] **Step 4: lint 확인**

Run: `npx eslint src/components/auth/LoginForm.tsx`
Expected: 에러 없음

- [ ] **Step 5: 타입체크 확인**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음 (다른 무관한 pre-existing 에러는 무시)

- [ ] **Step 6: 수동 브라우저 검증 (사용자 진행)**

1. `/login`에서 아무것도 입력하지 않고 로그인 버튼 클릭 → API 호출 없이 두 필드 아래에 각각 "아이디를 입력하세요." / "비밀번호를 입력하세요." 표시되는지
2. 아이디만 입력하고 제출 → 비밀번호 필드에만 에러 표시되는지
3. 에러 표시된 상태에서 해당 필드에 타이핑 시작하면 그 필드 에러가 사라지는지
4. 정상적인 아이디/비밀번호 입력 후 제출하면 기존과 동일하게 로그인되는지 (회귀 확인)

- [ ] **Step 7: 커밋**

```bash
git add src/components/auth/LoginForm.tsx
git commit -m "IH2-54 1. 로그인 폼 제출 전 필드 검증 및 인라인 에러 표시 기능추가"
```

---

### Task 4: FE `AppFrame` 로그인 가드

**Files:**
- Modify: `src/components/layout/AppFrame.tsx` (전체 31줄)

**Interfaces:**
- Consumes: `fetchAuthMeRequest()` from `src/features/auth/slice/authSlice.ts` (기존, 이번에 처음 dispatch됨), `state.auth: { user, loading, error }` (기존), `AppDispatch`/`RootState` from `src/store/store.ts` (기존)
- Produces: 없음

**중요 — 재확인 루프 방지:** `meChecked` ref는 "한 번 확인했으면 같은 보호 구간 방문 동안 재요청하지 않는다"를 보장하되, `/login`(bare path)으로 돌아올 때마다 `false`로 리셋한다. 리셋을 안 하면 로그아웃 직후 이미 `meChecked.current === true`인 상태로 리다이렉트가 완료되고, 그 다음 다시 보호된 경로에 진입했을 때 재확인을 안 해서 "확인 중..." 화면에 멈춰버린다 (로그아웃으로 인한 전체 상태 리셋은 `authUser`/`authError`를 둘 다 `null`로 되돌리는데, 이 값만으로는 "아직 확인 전"과 "확인했는데 실패함"을 구분할 수 없기 때문).

- [ ] **Step 1: `AppFrame.tsx` 전체를 아래로 교체**

```tsx
"use client";

import AppShell from "@/components/layout/AppShell";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuthMeRequest } from "@/features/auth/slice/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

type AppFrameProps = {
  children: React.ReactNode;
};

/** 사이드바/헤더 없이 보여주는 경로 (로그인 등) */
const BARE_PATHS = ["/login"];

/**
 * 공통 레이아웃 프레임
 * - /login : AppShell 없이 폼만
 * - 그 외 : 세션 확인(GET /api/auth/me) 후 인증되면 Sidebar+Header, 아니면 /login 이동
 */
export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const authError = useSelector((state: RootState) => state.auth.error);

  const isBare = BARE_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );

  /** 보호된 경로에서 이미 세션을 확인했는지 (bare 경로 재방문 시 리셋) */
  const meChecked = useRef(false);

  useEffect(() => {
    if (isBare) {
      meChecked.current = false;
      return;
    }
    if (authUser) return;
    if (authLoading) return;
    if (meChecked.current) return;
    meChecked.current = true;
    dispatch(fetchAuthMeRequest());
  }, [isBare, authUser, authLoading, dispatch]);

  useEffect(() => {
    if (isBare) return;
    if (authUser) return;
    if (authLoading) return;
    if (authError) {
      router.replace("/login");
    }
  }, [isBare, authUser, authLoading, authError, router]);

  if (isBare) {
    return <>{children}</>;
  }

  if (!authUser) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        확인 중...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 2: lint 확인**

Run: `npx eslint src/components/layout/AppFrame.tsx`
Expected: 에러 없음 (특히 `react-hooks/set-state-in-effect` — `router.replace`/`dispatch`는 setState가 아니라 이 규칙에 걸리지 않는다)

- [ ] **Step 3: 타입체크 확인**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음

- [ ] **Step 4: 수동 브라우저 검증 (사용자 진행)**

1. 로그아웃 상태에서 `/admin/emp` 같은 보호 경로를 주소창에 직접 입력해서 접근 → 잠깐 "확인 중..." 후 `/login`으로 이동하는지
2. 정상 로그인 → 보호 경로 진입 시 지연 없이 바로 화면이 뜨는지 (로그인 직후엔 이미 `authUser`가 있어서 재확인 안 함)
3. 로그인한 상태로 브라우저 새로고침(F5) → 잠깐 "확인 중..." 후 정상적으로 화면이 뜨는지 (세션 쿠키로 `/api/auth/me` 재확인)
4. 로그아웃 → 로그인 화면 이동 확인 → **다시 보호 경로로 직접 이동해서 여전히 `/login`으로 잘 튕기는지** (앞서 설명한 재확인 루프 리셋이 실제로 동작하는지 확인하는 핵심 케이스)

- [ ] **Step 5: 커밋**

```bash
git add src/components/layout/AppFrame.tsx
git commit -m "IH2-58 1. AppFrame 로그인 가드(세션 확인 후 미인증 시 /login 이동) 연결 기능추가"
```

---

## Task 순서 요약

1. Task 1 — BE `ErrorCode` 추가 + `GlobalExceptionHandler` 버그 수정
2. Task 2 — BE `AuthServiceImpl` 예외 교체 + curl 검증
3. Task 3 — FE `LoginForm` 필드 검증
4. Task 4 — FE `AppFrame` 로그인 가드

BE(Task 1~2) 커밋 후 `admin-service/docs/git-브랜치-커밋-규칙.md`의 흐름(`feature → auth 도메인 브랜치 → develop`)을, FE(Task 3~4) 커밋 후 `hisfrontend/docs/git-브랜치-커밋-규칙.md`의 흐름(`feature → develop`)을 따라 각각 반영한다.
