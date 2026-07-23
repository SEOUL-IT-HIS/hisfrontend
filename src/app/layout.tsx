import type { Metadata } from "next";
import AppFrame from "@/components/layout/AppFrame";
import StoreProvider from "@/components/providers/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HIS Frontend",
  description: "Hospital Information System",
};

/**
 * Google 폰트(next/font/google) 제거
 * - 외부 폰트 서버 응답이 느리면 페이지 자체가 검은/빈 화면으로 멈출 수 있음
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-slate-100 text-slate-800">
        <StoreProvider>
          <AppFrame>{children}</AppFrame>
        </StoreProvider>
      </body>
    </html>
  );
}
