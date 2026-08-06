import LoginForm from "@/components/auth/LoginForm";

/**
 * /login — 로그인 화면
 */
export default function Page() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--background)] px-4 py-10">
      <LoginForm />
    </div>
  );
}
