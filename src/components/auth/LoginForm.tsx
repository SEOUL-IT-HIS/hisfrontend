"use client";

/**
 * [로그인 폼] UI 만
 * - API / saga 연동 전
 * - loginId, password 입력
 */
import { useState } from "react";
import { Button, FormField, Input } from "@/components/common";

type LoginFormState = {
  loginId: string;
  password: string;
};

export default function LoginForm() {
  const [form, setForm] = useState<LoginFormState>({
    loginId: "",
    password: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: dispatch(fetchAuthLoginRequest({ loginId, password }))
  }

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

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="아이디" required htmlFor="loginId">
          <Input
            id="loginId"
            value={form.loginId}
            placeholder="로그인 아이디"
            autoComplete="username"
            onChange={(e) => setForm({ ...form, loginId: e.target.value })}
          />
        </FormField>

        <FormField label="비밀번호" required htmlFor="password">
          <Input
            id="password"
            type="password"
            value={form.password}
            placeholder="비밀번호"
            autoComplete="current-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </FormField>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full">
            로그인
          </Button>
        </div>
      </form>
    </div>
  );
}
