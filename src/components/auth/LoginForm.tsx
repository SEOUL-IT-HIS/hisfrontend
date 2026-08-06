"use client";

/**
 * [로그인 폼]
 * dispatch(fetchAuthLoginRequest) → saga → POST /api/auth/login
 * 성공 시 /admin/emp 이동
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitRedirect = useRef(false);

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

  useEffect(() => {
    if (!waitRedirect.current) return;
    if (loading) return;
    if (error) {
      waitRedirect.current = false;
      return;
    }
    if (user) {
      waitRedirect.current = false;
      router.push("/admin/emp");
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

      {error ? (
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
