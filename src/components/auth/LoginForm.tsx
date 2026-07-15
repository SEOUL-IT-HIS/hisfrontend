"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { login } from "@/features/auth/api";
import { resolveAuthMessage } from "@/features/auth/messages";
import { saveSession } from "@/features/auth/session";

const SAVED_ID_KEY = "his.auth.savedLoginId";

export default function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_ID_KEY);
    if (saved) {
      setLoginId(saved);
      setSaveId(true);
    }
  }, []);

  function handleLoginIdChange(e: ChangeEvent<HTMLInputElement>) {
    setLoginId(e.target.value);
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!loginId.trim()) {
      setError("로그인 ID를 입력해주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const session = await login({
        loginId: loginId.trim(),
        password,
      });
      if (saveId) {
        localStorage.setItem(SAVED_ID_KEY, loginId.trim());
      } else {
        localStorage.removeItem(SAVED_ID_KEY);
      }
      saveSession(session);
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(resolveAuthMessage(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col" noValidate>
      <div className="mb-10 text-center">
        <p className="text-[2rem] font-bold tracking-tight text-[#2f80ed]">HIS</p>
        <p className="mt-1 text-sm text-slate-400">Hospital Information System</p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 19.5c1.8-3.2 4.2-4.5 7-4.5s5.2 1.3 7 4.5" />
            </svg>
          </span>
          <input
            type="text"
            name="loginId"
            autoComplete="username"
            value={loginId}
            onChange={handleLoginIdChange}
            disabled={submitting}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2f80ed] disabled:bg-slate-50"
            placeholder="로그인 ID"
          />
        </label>

        <label className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={submitting}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#2f80ed] disabled:bg-slate-50"
            placeholder="비밀번호"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={saveId}
            onChange={(e) => setSaveId(e.target.checked)}
            disabled={submitting}
            className="h-4 w-4 rounded border-slate-300 text-[#2f80ed] focus:ring-[#2f80ed]"
          />
          ID 저장
        </label>
        <button
          type="button"
          className="text-slate-500 hover:text-[#2f80ed]"
          onClick={() => setError("비밀번호 재설정은 추후 제공됩니다.")}
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 h-12 w-full rounded-xl bg-[#2f80ed] text-sm font-semibold text-white hover:bg-[#2570d4] disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {submitting ? "로그인 중…" : "로그인"}
      </button>

      <button
        type="button"
        disabled={submitting}
        onClick={() => setError("회원가입은 관리자 직원등록으로 진행해주세요.")}
        className="mt-3 h-12 w-full rounded-xl border border-[#2f80ed] bg-white text-sm font-semibold text-[#2f80ed] hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        회원가입
      </button>

      <p className="mt-8 text-center text-xs text-slate-400">v0.1.0 버전 정보</p>
    </form>
  );
}
