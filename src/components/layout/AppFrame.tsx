"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { getSession } from "@/features/auth/session";

type AppFrameProps = {
  children: React.ReactNode;
};

/**
 * - 비로그인: /login 만 허용 (localhost:3000 접속 시 로그인 폼)
 * - 로그인 후: 기존 AppShell(사이드바·헤더) + 홈 화면
 */
export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const session = getSession();
    const hasSession = session != null;
    setAuthed(hasSession);

    if (!hasSession && pathname !== "/login") {
      router.replace("/login");
      setReady(true);
      return;
    }

    if (hasSession && pathname === "/login") {
      router.replace("/");
      setReady(true);
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return <div className="h-full min-h-screen bg-[#e8eef5]" />;
  }

  if (!authed || pathname === "/login") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
