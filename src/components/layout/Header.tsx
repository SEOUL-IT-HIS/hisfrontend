"use client";

import Link from "next/link";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button, FormField, Input, Modal } from "@/components/common";
import { changePasswordApi } from "@/features/auth/api/authApi";
import type { RootState } from "@/store/store";

/** ROLE.ROLE_CODE — 시스템 관리자. 팀원 공용 계정이라 비밀번호 변경 메뉴를 보여주지 않는다 */
const ROLE_CODE_ADMIN = "01";

/** 새 비밀번호 규칙 — admin-service AuthServiceImpl 과 같은 값 (8~20자, 영문·숫자 각 1개 이상) */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

/**
 * 상단 바
 *
 * 우측 사용자 배지는 로그인한 계정 정보(auth.user)를 그대로 보여준다.
 * 이름이 없으면 사번, 사번도 없으면 로그인 아이디 순으로 대신 표시한다.
 *
 * 비밀번호 변경 (IH2-115)
 * - 배지를 누르면 작은 메뉴가 열리고, "Change password" 로 변경 모달을 띄운다.
 * - 관리자(역할 01)는 팀원 공용 계정이라 서버가 변경을 막으므로, 배지를 누를 수 없게 그대로 둔다.
 */
export default function Header() {
  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.empName || user?.empNo || user?.loginId || "";
  const badgeText = displayName.slice(0, 2);

  // roleCodes 는 "01" 또는 "01,03" 같은 쉼표 문자열이다
  const isAdmin = (user?.roleCodes ?? "").split(",").includes(ROLE_CODE_ADMIN);

  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  function openPasswordModal() {
    setMenuOpen(false);
    setPasswordOpen(true);
  }

  // 배지 안쪽 모양 (관리자용 표시와 버튼이 같은 모양을 쓴다)
  const badgeInner = (
    <>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
        {badgeText}
      </span>
      <span className="hidden text-xs font-medium text-slate-700 sm:inline">
        {displayName}
      </span>
    </>
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href="/main"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-700"
          aria-label="대문으로 이동"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900">
            Hospital Information System
          </h1>
          <p className="text-[11px] text-slate-400">SANDAE HOSPITAL · Admin Console</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 sm:inline-flex">
          Operational
        </span>
        {isAdmin || user == null ? (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            {badgeInner}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition-colors hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {badgeInner}
            </button>

            {menuOpen ? (
              <>
                {/* 메뉴 바깥을 누르면 닫히도록 화면 전체를 덮는 투명 판 */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openPasswordModal}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Change password
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 모달이 닫히면 Modal 이 아무것도 그리지 않으므로, 다시 열 때 폼 입력값이 새로 시작된다 */}
      <Modal
        open={passwordOpen}
        title="Change password"
        onClose={() => setPasswordOpen(false)}
        maxWidthClassName="max-w-md"
      >
        <ChangePasswordForm onClose={() => setPasswordOpen(false)} />
      </Modal>
    </header>
  );
}

/** 8~20자, 영문과 숫자가 각각 하나 이상 (서버와 같은 규칙) */
function isValidPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return false;
  }
  let hasLetter = false;
  let hasDigit = false;
  for (const c of password) {
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
      hasLetter = true;
    }
    if (c >= "0" && c <= "9") {
      hasDigit = true;
    }
  }
  return hasLetter && hasDigit;
}

/**
 * 비밀번호 변경 폼 (현재 / 새 / 새 확인)
 * 화면에서 먼저 규칙을 검사하고, 서버 오류(현재 비밀번호 틀림 등)는 그대로 보여준다.
 */
function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Fill in all fields.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError("Use 8-20 characters with at least one letter and one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords don't match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change the password.");
    } finally {
      setSaving(false);
    }
  }

  // 변경 완료 화면
  if (done) {
    return (
      <div className="space-y-4">
        <Alert variant="success">Your password has been changed. Use it the next time you sign in.</Alert>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Current password" required htmlFor="currentPassword">
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </FormField>
      <FormField label="New password" required htmlFor="newPassword">
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </FormField>
      <FormField label="Confirm new password" required htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </FormField>
      <p className="text-xs text-slate-400">
        {PASSWORD_MIN_LENGTH}-{PASSWORD_MAX_LENGTH} characters, with at least one letter and one number.
      </p>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}
