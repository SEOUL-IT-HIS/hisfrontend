import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

/**
 * /login — 로그인 화면
 */
export default function Page() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--background)] px-4 py-10">
      {/*
        Suspense 로 감싸는 이유 — LoginForm 이 useSearchParams() 로 ?reason=expired 를
        읽는다(세션이 끊겨서 밀려났을 때 안내 문구를 다르게 보여주려고 axios 인터셉터가
        붙여 보내는 값이다). App Router 는 그 훅을 쓰는 트리를 Suspense 로 감싸지 않으면
        프로덕션 빌드에서 막는다. 개발 서버에서는 경고 없이 넘어가 놓치기 쉽다.
        surgery/worklist 페이지도 같은 이유로 감싸져 있다.
      */}
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
