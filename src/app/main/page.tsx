"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { areaIcon } from "@/components/sidebar/Sidebar";
import type { MenuTreeNode } from "@/features/system/types/menuTypes";
import type { RootState } from "@/store/store";

/**
 * /main — 로그인 후 대문
 *
 * 위쪽 인사 영역(날짜·시계·인사말)은 참고 삼은 EMR 홈 화면의 구성을 우리 팀 톤으로
 * 다시 그린 것. 사람 일러스트 대신, 아래 카드와 같은 팔레트(sky/emerald/violet/amber/rose)를
 * 쓰는 추상적인 flat 일러스트(HeroIllustration)로 색감을 통일했다.
 *
 * 아래 업무영역 카드는 사이드바와 같은 menuTree(state.system.items)를 그대로 써서 그린다.
 * 최상위 영역 자체에는 menuUrl이 없는 경우가 많아, 하위에서 처음 만나는 링크로 보낸다.
 */
function firstUrl(node: MenuTreeNode): string | null {
  if (node.menuUrl) return node.menuUrl;
  for (const child of node.children) {
    const url = firstUrl(child);
    if (url) return url;
  }
  return null;
}
function formatClock(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${hour12}:${mm} ${ampm}`;
}

function greetingPhrase(hours: number) {
  if (hours < 6) return "Thank you for working late tonight.";
  if (hours < 12) return "Good morning — have a great day.";
  if (hours < 18) return "Hope you are having a good afternoon.";
  return "Thank you for all your hard work today.";
}

/** 영역 카드 포인트 컬러 — menuId 순서대로 순환 배정 */
const AREA_PALETTE = [
  { chip: "bg-sky-50 text-sky-600 group-hover:bg-sky-100", ring: "hover:border-sky-300" },
  { chip: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100", ring: "hover:border-emerald-300" },
  { chip: "bg-violet-50 text-violet-600 group-hover:bg-violet-100", ring: "hover:border-violet-300" },
  { chip: "bg-amber-50 text-amber-600 group-hover:bg-amber-100", ring: "hover:border-amber-300" },
  { chip: "bg-rose-50 text-rose-600 group-hover:bg-rose-100", ring: "hover:border-rose-300" },
  { chip: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100", ring: "hover:border-indigo-300" },
];

/**
 * 대문 인사 영역의 장식 일러스트.
 * 사람을 그리는 대신, 아래 카드 그리드와 같은 팔레트로 "케어의 기운"을 추상적으로 표현했다
 * (부드러운 배경 덩어리 + 십자가 배지 + 맥박선 + 컬러 점).
 */
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 280 200"
      className="h-36 w-52 shrink-0 md:h-44 md:w-64"
      fill="none"
      aria-hidden
    >
      <ellipse cx="150" cy="108" rx="122" ry="88" fill="#e0f2fe" />
      <circle cx="66" cy="152" r="40" fill="#d1fae5" opacity="0.85" />
      <path
        d="M32 118 C 62 88, 84 152, 116 108 S 158 66, 196 100"
        stroke="#7dd3fc"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="93"
        y="52"
        width="112"
        height="82"
        rx="20"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <path
        d="M149 76v34M132 93h34"
        stroke="#0284c7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M98 120h17l8-15 9 27 8-12h22"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="220" cy="58" r="6" fill="#c4b5fd" />
      <circle cx="52" cy="66" r="5" fill="#fbbf24" opacity="0.9" />
      <circle cx="228" cy="142" r="5" fill="#fda4af" opacity="0.9" />
      <circle cx="205" cy="168" r="4" fill="#0284c7" opacity="0.6" />
    </svg>
  );
}

export default function MainPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const menuTree = useSelector((state: RootState) => state.system.items);
  const greetingName = user?.empName || user?.empNo || user?.loginId || "";

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const dateLabel = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 p-6">
      <div className="flex items-center justify-between gap-6 overflow-hidden rounded-2xl border border-sky-100 bg-white p-8">
        <div>
          <p className="text-sm text-slate-400">{dateLabel}</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight text-slate-900">
            {formatClock(now)}
          </p>
          <p className="mt-4 text-base text-slate-600">
            <span className="font-medium text-slate-800">
              {greetingName ? `Hello, ${greetingName}. ` : ""}
            </span>
            {greetingPhrase(now.getHours())}
          </p>
        </div>
        <div className="hidden md:block">
          <HeroIllustration />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuTree.map((area, index) => {
          const href = firstUrl(area);
          const subLabels = area.children
            .slice(0, 3)
            .map((child) => child.menuName)
            .join(" · ");
          const palette = AREA_PALETTE[index % AREA_PALETTE.length];

          const card = (
            <div
              className={`group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${palette.ring}`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${palette.chip}`}
                >
                  {areaIcon(area.areaKey)}
                </div>
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 -translate-x-1 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-slate-400 group-hover:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="M7.5 5 12.5 10 7.5 15" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {area.menuName}
                </h2>
                {subLabels ? (
                  <p className="mt-1 text-xs text-slate-400">{subLabels}</p>
                ) : null}
              </div>
            </div>
          );

          return href ? (
            <Link key={area.menuId} href={href}>
              {card}
            </Link>
          ) : (
            <div key={area.menuId} className="opacity-60">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
