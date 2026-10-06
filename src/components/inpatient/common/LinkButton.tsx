"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type LinkButtonVariant = "primary" | "secondary" | "danger" | "ghost";

// 공통 Button(@/components/common/Button)과 같은 모양 — <Link> 안에 <button>을 넣으면 잘못된 HTML이라 링크용으로 따로 둠
const variantClass: Record<LinkButtonVariant, string> = {
  primary: "bg-sky-600 text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700",
  secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
};

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: LinkButtonVariant;
  children: ReactNode;
};

export default function LinkButton({ variant = "primary", className = "", children, ...rest }: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
