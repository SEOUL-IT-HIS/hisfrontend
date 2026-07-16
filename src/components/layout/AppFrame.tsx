"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { fetchMe } from "@/features/auth/api";

type AppFrameProps = {
  children: React.ReactNode;
};

/**
 * - 비로그인: /login 만 허용
 * - 로그인 여부: BE GET /api/auth/me (HttpSession) 로 확인
 */
export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        await fetchMe();
        if (cancelled) return;

        setAuthed(true);

        if (pathname === "/login") {
          router.replace("/");
        }
        setReady(true);
      } catch {
        if (cancelled) return;

        setAuthed(false);

        if (pathname !== "/login") {
          router.replace("/login");
        }
        setReady(true);
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return <div className="h-full min-h-screen bg-[#e8eef5]" />;
  }

  if (!authed || pathname === "/login") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
