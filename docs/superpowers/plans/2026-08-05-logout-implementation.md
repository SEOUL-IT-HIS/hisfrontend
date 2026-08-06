# 로그아웃 기능(IH2-6) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sidebar에서 로그아웃을 실행하고(IH2-61), 성공 시 Redux 상태를 완전히 초기화한 뒤(IH2-59) `/login`으로 이동시킨다. BE 세션 무효화(IH2-60)는 이미 구현되어 있어 검증만 한다.

**Architecture:** 기존 로그인 흐름(`fetchAuthLoginRequest` → saga → success/failure, `LoginForm.tsx`의 `waitRedirect` ref+`useEffect` 패턴)을 로그아웃에 그대로 대칭 적용한다. 클라이언트 상태 초기화는 과거 동일 티켓(IH2-59, 커밋 `6ad067f`)에서 썼던 `LOGOUT_RESET` 액션 + `rootReducer` 래핑 방식을 재사용한다.

**Tech Stack:** Next.js(App Router) / React 19 / Redux Toolkit + redux-saga / TypeScript / Tailwind. BE: Spring Boot(admin-service), 세션 기반 인증.

## Global Constraints

- 참고 설계 문서: [docs/superpowers/specs/2026-08-05-logout-design.md](../specs/2026-08-05-logout-design.md)
- 범위: IH2-61 / IH2-60(검증만) / IH2-59. IH2-62(접근 차단)는 이번 계획에 포함하지 않는다.
- `src/store/rootReducer.ts`는 리드 전용 파일 — 수정 후 PR에서 리드 승인 필요.
- 이 저장소에는 자동화 테스트 러너(jest/vitest 등)가 설정되어 있지 않다. 각 태스크의 "테스트" 단계는 `npm run lint`(정적 검사)와 브라우저/`curl`을 통한 수동 검증으로 대체한다.
- 프로젝트 규칙(`admin-service/docs/git-브랜치-커밋-규칙.md`)상 **서버 기동은 에이전트가 아니라 사용자가 로컬에서 직접** 한다. 구현 태스크에는 "서버를 실행해달라"는 안내만 포함하고, 에이전트가 직접 `npm run dev` / `gradlew bootRun`을 실행하지 않는다.
- 에러 메시지는 raw `alert()` 대신 기존 `Alert` 컴포넌트(인라인)로 표시한다 — `LoginForm.tsx`와 동일한 패턴.
- 커밋 메시지 형식: `IH2-XX 1. 설명 기능추가|기능수정`.

---

## File Structure

- Create: `src/features/auth/logoutReset.ts` — `LOGOUT_RESET` 액션 타입 + `logoutReset()` 크리에이터. Redux 상태 전체 초기화를 트리거하는 신호 역할만 한다.
- Modify: `src/store/rootReducer.ts` — 기존 `combineReducers` 결과를 `appReducer`로 이름 바꾸고, `LOGOUT_RESET` 액션을 감시해서 상태를 `undefined`로 리셋하는 wrapper `rootReducer`로 교체.
- Modify: `src/components/sidebar/Sidebar.tsx` — footer에 "로그아웃" 버튼, `ConfirmDialog`(확인), 로그아웃 요청 dispatch, 성공/실패 감시 `useEffect`, 에러 `Alert` 추가.
- (BE) 코드 변경 없음 — `admin-service`의 `AuthController.logout()`은 이미 `session.invalidate()`를 호출하고 있음. 검증 태스크만 진행.

---

### Task 1: `LOGOUT_RESET` 액션 정의

**Files:**
- Create: `src/features/auth/logoutReset.ts`

**Interfaces:**
- Produces: `LOGOUT_RESET: string` (액션 타입 상수), `logoutReset(): { type: typeof LOGOUT_RESET }` — Task 2(`rootReducer.ts`)와 Task 3(`Sidebar.tsx`)에서 사용.

- [ ] **Step 1: 파일 작성**

`src/features/auth/logoutReset.ts`:

```ts
/**
 * [로그아웃 시 클라이언트 상태 전체 초기화 트리거]
 * rootReducer 가 이 액션 타입을 감시해서 Redux state 를 초기 상태로 되돌린다.
 */
export const LOGOUT_RESET = "auth/LOGOUT_RESET";

export function logoutReset() {
  return { type: LOGOUT_RESET } as const;
}
```

- [ ] **Step 2: lint 확인**

Run: `npm run lint -- src/features/auth/logoutReset.ts`
Expected: 에러 없음 (경고도 없어야 함 — 새 파일이므로)

- [ ] **Step 3: 커밋**

```bash
git add src/features/auth/logoutReset.ts
git commit -m "IH2-59 1. 로그아웃 시 클라이언트 상태 초기화용 LOGOUT_RESET 액션 추가 기능추가"
```

---

### Task 2: `rootReducer`에 `LOGOUT_RESET` 처리 연결

**Files:**
- Modify: `src/store/rootReducer.ts` (전체 파일, 현재 72줄)

**Interfaces:**
- Consumes: `LOGOUT_RESET` from `src/features/auth/logoutReset.ts` (Task 1)
- Produces: 기존과 동일한 `default export rootReducer` (타입/동작은 그대로, `LOGOUT_RESET` 액션이 들어왔을 때만 전체 상태 리셋)

- [ ] **Step 1: `rootReducer.ts` 전체를 아래 내용으로 교체**

기존 `combineReducers(...)` 호출부는 그대로 두되 변수명을 `appReducer`로 바꾸고, 그 아래에 `LOGOUT_RESET`을 감시하는 wrapper 함수를 추가한다. 등록된 리듀서 목록(주석 포함)은 절대 건드리지 않는다.

```ts
import { combineReducers, type UnknownAction } from "@reduxjs/toolkit";
import { LOGOUT_RESET } from "@/features/auth/logoutReset";

// ----- 서비스별 reducer (담당자 slice 준비되면 import 후 아래에 등록) -----
// import patientReducer from "@/features/patient/slice";
// import receptionReducer from "@/features/reception/slice";
// import billingReducer from "@/features/billing/slice";
 import outpatientReducer from "@/features/outpatient/common/slice";
import emergencyReducer from "@/features/emergency/common/slice";
import inpatientReducer from "@/features/inpatient/slice";
import labImagingReducer from "@/features/labimaging/common/slice";
// import pharmacyReducer from "@/features/pharmacy/slice";
import surgeryReducer from "@/features/surgery/slice";
// import adminReducer from "@/features/admin/slice";
import commonCodeItemReducer from "@/features/commonCode/slice/commonCodeItemSlice";
import commonCodeGroupReducer from "@/features/commonCode/slice/commonCodeGroupSlice";
import authReducer from "@/features/auth/slice/authSlice";
import empReducer from "@/features/emp/slice/empSlice";
import systemReducer from "@/features/system/slice/menuSlice";
import patientReducer from "@/features/patient/slice/patientSlice";
import billingDetailReducer from "@/features/billing/searchBillingDetail/slice";
import billingMasterReducer from "@/features/billing/billingMaster/slice";

/**
 * RootReducer (프론트 리더 관리 영역)
 * - 담당 영역(auth/admin/commonCode/system) 초기화 — 재구현 후 등록
 * - combineReducers 는 최소 1개 reducer 필요 → placeholder 유지
 * - LOGOUT_RESET 액션 수신 시 전체 상태를 초기값으로 리셋한다 (로그아웃 후 잔여 상태 방지)
 */
const placeholderReducer = (state: Record<string, never> = {}) => state;

const appReducer = combineReducers({
  _bootstrap: placeholderReducer,

  // 공통
  system: systemReducer,
  auth: authReducer,
  commonCodeGroup: commonCodeGroupReducer,
  commonCodeItem: commonCodeItemReducer,
  emp: empReducer,

  // 관리자 (ADM)
  // admin: adminReducer,

  // 환자 (PAT)
  patient: patientReducer,

  // 접수 (RCP)
  // reception: receptionReducer,

  // 수납/청구 (BIL)
  billingDetail: billingDetailReducer,
  billingMaster: billingMasterReducer,

  // 외래 (OPD)
  outpatient: outpatientReducer,

  // 응급 (EMG)
  emergency: emergencyReducer,

  // 입원 (IPT)
  inpatient: inpatientReducer,

  // 검사/영상 (LAB)
  labImaging: labImagingReducer,

  // 약국 (PHM)
  // pharmacy: pharmacyReducer,

  // 수술 (SUR)
  surgery: surgeryReducer,
});

function rootReducer(
  state: ReturnType<typeof appReducer> | undefined,
  action: UnknownAction,
) {
  if (action.type === LOGOUT_RESET) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
}

export default rootReducer;
```

- [ ] **Step 2: lint 확인**

Run: `npm run lint -- src/store/rootReducer.ts`
Expected: 에러 없음. (기존에 있던 무관한 경고는 이 파일에서 나지 않는 것을 확인 — 이 파일은 원래 lint 에러/경고 없었음)

- [ ] **Step 3: 타입체크 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (특히 `store.ts`의 `RootState = ReturnType<typeof store.getState>` 타입이 깨지지 않는지 확인 — `rootReducer`가 함수로 바뀌었어도 반환 타입은 기존 `combineReducers` 결과와 동일해야 함)

- [ ] **Step 4: 커밋**

```bash
git add src/store/rootReducer.ts
git commit -m "IH2-59 1. rootReducer 에 LOGOUT_RESET 수신 시 전체 상태 초기화 로직 연결 기능추가"
```

---

### Task 3: Sidebar 로그아웃 버튼 + 확인 다이얼로그 + 처리 흐름

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx` (현재 271줄)

**Interfaces:**
- Consumes:
  - `fetchAuthLogoutRequest()` from `src/features/auth/slice/authSlice.ts` (기존)
  - `logoutReset()` from `src/features/auth/logoutReset.ts` (Task 1)
  - `state.auth: { user: AuthUser | null; loading: boolean; error: string | null }` (기존 `authSlice`)
  - `AppDispatch`, `RootState` from `src/store/store.ts` (기존)
  - `Alert`, `ConfirmDialog` from `src/components/common` (기존)
- Produces: 없음 (leaf 컴포넌트)

**주의:** `Sidebar`는 이미 `loading`/`error` 라는 이름의 **props**(메뉴 트리 로딩 상태)를 갖고 있다. auth 상태를 가져올 때 반드시 `authLoading` / `authError` / `authUser` 처럼 다른 이름을 써서 기존 props와 충돌하지 않게 한다.

- [ ] **Step 1: import 추가**

파일 최상단 import 블록을 아래와 같이 수정 (기존 `useEffect, useState`에 `useRef` 추가, react-redux/next-navigation/공통 컴포넌트/auth 관련 import 신규 추가):

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MenuTreeNode } from "@/features/system/types/menuTypes";
import { Alert, ConfirmDialog } from "@/components/common";
import { fetchAuthLogoutRequest } from "@/features/auth/slice/authSlice";
import { logoutReset } from "@/features/auth/logoutReset";
import type { AppDispatch, RootState } from "@/store/store";
```

- [ ] **Step 2: 컴포넌트 내부에 로그아웃 상태/핸들러 추가**

`export default function Sidebar(...)` 함수 본문, 기존 `const [collapsed, setCollapsed] = useState(false);` 아래에 추가:

```tsx
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const authError = useSelector((state: RootState) => state.auth.error);
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  /** true 이면 로그아웃 요청 결과를 기다리는 중 */
  const waitLogout = useRef(false);

  function handleLogoutClick() {
    setLogoutConfirmOpen(true);
  }

  function handleLogoutCancel() {
    if (authLoading) return;
    setLogoutConfirmOpen(false);
  }

  function handleLogoutConfirm() {
    waitLogout.current = true;
    dispatch(fetchAuthLogoutRequest());
  }

  useEffect(() => {
    if (!waitLogout.current) return;
    if (authLoading) return;
    if (authError) {
      waitLogout.current = false;
      return;
    }
    if (!authUser) {
      waitLogout.current = false;
      setLogoutConfirmOpen(false);
      dispatch(logoutReset());
      router.replace("/login");
    }
  }, [authLoading, authError, authUser, dispatch, router]);
```

- [ ] **Step 3: footer JSX에 로그아웃 버튼 + 에러 Alert 추가**

기존 footer 블록(파일 249~268줄, `환경설정` 버튼이 있는 `<div className="mt-auto ...">`)을 아래로 교체 — "환경설정" 버튼 뒤에 "로그아웃" 버튼과 에러 `Alert`를 추가:

```tsx
      <div
        className={`mt-auto flex flex-col gap-1 border-t border-sky-100/80 px-2 py-3 text-xs text-slate-400 ${
          collapsed ? "items-center text-[10px]" : ""
        }`}
      >
        <span className={collapsed ? "" : "px-2"}>v0.1.0</span>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          {collapsed ? "펼치기" : "메뉴 접기"}
        </button>
        <button
          type="button"
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          환경설정
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          로그아웃
        </button>
        {authError ? (
          <Alert variant="error" className="mt-1">
            {authError}
          </Alert>
        ) : null}
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmLabel="로그아웃"
        cancelLabel="취소"
        submitting={authLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </aside>
  );
}
```

(`<ConfirmDialog>`는 `</aside>` 바로 앞, 즉 `aside`의 마지막 자식으로 들어간다. `Modal`이 `fixed inset-0`로 렌더링되므로 `aside`의 폭 제약과 무관하게 화면 전체를 덮는다.)

- [ ] **Step 4: lint 확인**

Run: `npm run lint -- src/components/sidebar/Sidebar.tsx`
Expected: 에러 없음. `authLoading`/`authError`/`authUser` 등 새 변수에 대한 미사용 경고가 없어야 함 (모두 JSX/effect에서 실제로 쓰임).

- [ ] **Step 5: 타입체크 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 수동 브라우저 검증 (사용자 진행)**

에이전트가 서버를 직접 기동하지 않는다 — 사용자가 로컬에서 `npm run dev`로 FE를, BE도 함께 띄운 상태에서 아래를 확인:

1. 로그인 후 사이드바 하단 "로그아웃" 버튼 클릭 → "정말 로그아웃하시겠습니까?" 확인 다이얼로그가 뜨는지
2. "취소" 클릭 시 다이얼로그만 닫히고 로그인 상태가 유지되는지
3. "로그아웃" 클릭(확인) 시 다이얼로그가 "처리 중..."으로 바뀌었다가, `/login`으로 이동하는지
4. 로그아웃 후 새로고침(F5) 없이 브라우저 개발자도구 Redux 상태(또는 재로그인 화면에서 이전 화면 데이터 노출 여부)를 확인해 이전 세션의 목록/폼 데이터가 남아있지 않은지 (`LOGOUT_RESET`이 정상 동작하는지 간접 확인)
5. BE를 잠시 내려서 로그아웃 API가 실패하는 상황을 재현 → 버튼 클릭 시 다이얼로그 아래(또는 사이드바 하단)에 에러 `Alert`가 뜨고 페이지 이동은 되지 않는지

- [ ] **Step 7: 커밋**

```bash
git add src/components/sidebar/Sidebar.tsx
git commit -m "IH2-61 1. 사이드바 로그아웃 버튼/확인다이얼로그 및 로그아웃 처리 흐름 연결 기능추가"
```

---

### Task 4: BE 세션 무효화 검증 (IH2-60, 코드 변경 없음)

**Files:** 없음 (검증만 — `admin-service/.../auth/controller/AuthController.java`는 이미 `session.invalidate()` 구현되어 있어 수정하지 않는다)

**Interfaces:** 없음

- [ ] **Step 1: BE 서버를 로컬에서 직접 기동 (사용자 진행, 에이전트가 대신 기동하지 않음)**

- [ ] **Step 2: 로그인 → me → logout → me 순서로 curl 검증**

세션 쿠키를 파일로 저장하며 순서대로 호출한다 (`localhost:8080`은 실제 admin-service 포트로 교체):

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId":"<테스트 계정>","password":"<비밀번호>"}'

curl -b cookies.txt http://localhost:8080/api/auth/me
# Expected: code 200, 로그인한 사용자 정보 반환

curl -b cookies.txt -X POST http://localhost:8080/api/auth/logout
# Expected: code 200

curl -b cookies.txt http://localhost:8080/api/auth/me
# Expected: code 400, message "로그인이 필요합니다." — 세션이 무효화되어 더 이상 인증되지 않음을 확인
```

- [ ] **Step 3: 결과 기록**

위 4번째 curl 응답이 실제로 실패(400)로 오는지만 확인하면 IH2-60은 완료. 실패하지 않고 여전히 사용자 정보가 반환되면 세션 무효화가 안 되는 것이므로, 그때 별도로 원인 조사 태스크를 추가한다 (이 계획에는 포함하지 않음 — 정상 동작이 전제).

---

## Task 순서 요약

1. Task 1 — `logoutReset.ts` 생성
2. Task 2 — `rootReducer.ts`에 리셋 로직 연결 (리드 승인 필요 파일)
3. Task 3 — `Sidebar.tsx`에 로그아웃 UI/흐름 연결
4. Task 4 — BE 세션 무효화 curl 검증 (코드 변경 없음)

3개 FE 커밋(IH2-59 ×2, IH2-61 ×1) 후 `docs/git-브랜치-커밋-규칙.md`의 FE 흐름(`feature → develop 머지 → develop push`)을 따라 develop에 반영한다. BE는 코드 변경이 없으므로 별도 커밋/머지가 필요 없다.
