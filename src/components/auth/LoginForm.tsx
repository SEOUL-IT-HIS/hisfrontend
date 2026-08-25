"use client";

/**
 * [로그인 폼]
 * dispatch(fetchAuthLoginRequest) → saga → POST /api/auth/login
 * 성공 시 /main(대문) 이동
 */
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormField, Input } from "@/components/common";
import { fetchAuthLoginRequest } from "@/features/auth/slice/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

type LoginFormState = {
  loginId: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("reason") === "expired";
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);
  const error = useSelector((state: RootState) => state.auth.error);
  const user = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState<LoginFormState>({
    loginId: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    loginId?: string;
    password?: string;
  }>({});

  /**
   * 이번 화면에서 실제로 로그인을 시도한 적 있는지.
   * 이게 없으면, 세션 만료로 리다이렉트됐을 때 배경에서 실패했던 /api/auth/me 의
   * leftover 에러("로그인이 필요합니다.")까지 같이 떠서 안내 문구랑 중복돼 보인다.
   * 실제로 로그인 버튼을 눌러본 뒤부터는(성공이든 실패든) 정상적으로 에러를 보여줘야 한다.
   */
  const [hasSubmitted, setHasSubmitted] = useState(false);

  /**
   * true 이면 "방금 로그인 버튼을 눌러서 결과를 기다리는 중" 이라는 뜻.
   * state 로 안 만들고 ref 로 만든 이유: 이 값이 바뀐다고 화면을 다시 그릴 필요는 없고,
   * 아래 useEffect 안에서 "이번 제출에 대한 반응인지"만 판단하면 되기 때문.
   * (그냥 loading/error/user 만 보면, 페이지에 처음 들어왔을 때도 조건이 우연히 맞아
   * 버릴 수 있어서 "제출을 실제로 했는가"를 별도로 기억해둔다.)
   */
  const waitRedirect = useRef(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 빈 값이면 서버까지 안 가고 여기서 바로 막는다 (불필요한 API 호출/네트워크 대기 방지)
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

    setHasSubmitted(true);
    waitRedirect.current = true;
    dispatch(fetchAuthLoginRequest({ loginId, password }));
  }

  /**
   * dispatch(fetchAuthLoginRequest) 는 결과를 바로 안 돌려준다 (redux-saga가 비동기로 API를 호출하고,
   * 끝나면 store 의 loading/error/user 를 갱신할 뿐). 그래서 "제출 → 결과" 는 여기서 store 값이
   * 바뀔 때마다 감시하는 방식으로 처리한다: 로딩 중이면 대기, 실패면 에러만 보여주고 종료,
   * 성공(user 채워짐)이면 목록 화면으로 이동.
   */
  useEffect(() => {
    if (!waitRedirect.current) return;
    if (loading) return;
    if (error) {
      waitRedirect.current = false;
      return;
    }
    if (user) {
      waitRedirect.current = false;
      router.push("/main");
    }
  }, [loading, error, user, router]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">
          HIS
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          로그인
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          아이디와 비밀번호를 입력하세요.
        </p>
      </div>

      {isExpired ? (
        <div className="mb-4">
          <Alert variant="info">세션이 만료되어 다시 로그인해주세요.</Alert>
        </div>
      ) : null}

      {error && (hasSubmitted || !isExpired) ? (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      </form>
    </div>
  );
}
