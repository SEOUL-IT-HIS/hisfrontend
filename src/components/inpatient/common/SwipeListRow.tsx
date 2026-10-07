"use client";

import { useRef, type ReactNode } from "react";
import SwipeRow, { type SwipeAction } from "@/components/inpatient/common/SwipeRow";

type SwipeListRowProps = {
  /** 스크린 리더용 행 이름 (예: "Reservation for 홍길동") */
  label: string;
  selected: boolean;
  /** 밀었을 때 나오는 동작 — 비어 있으면 밀기 없이 일반 행으로 그림. 첫 번째가 맨 바깥(주 동작) */
  actions: SwipeAction[];
  /** 행을 클릭했을 때(드래그 제외) — 보통 오른쪽 상세 패널 열기 */
  onSelect: () => void;
  /** 주 동작(첫 번째)의 배경색 — 기본은 빨강(삭제) */
  actionColor?: string;
  children: ReactNode;
};

/**
 * 입원 목록의 "밀어서 동작 열기" 행 — 병상예약·병상배정·병상현황 목록이 같이 씀
 * - 카드 테두리·선택 강조는 이 바깥 div가 담당 (SwipeRow 자체는 테두리가 없음)
 * - 밀기(드래그)와 클릭 구분: 5px 넘게 움직였으면 onSelect 를 건너뜀
 * - 동작 버튼을 누른 클릭은 상세 열기로 이어지지 않게 막음
 */
export default function SwipeListRow({
  label,
  selected,
  actions,
  onSelect,
  actionColor = "#e11d48",
  children,
}: SwipeListRowProps) {
  const downPoint = useRef<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const d = downPoint.current;
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
    onSelect();
  };

  const swipeable = actions.length > 0;

  return (
    <div
      onPointerDownCapture={(e) => {
        downPoint.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={handleClick}
      className={`shrink-0 overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
        selected ? "border-sky-300" : "border-slate-200/80"
      } ${swipeable ? "" : "cursor-pointer"}`}
    >
      {swipeable ? (
        <SwipeRow
          label={label}
          actions={actions}
          fullSwipe={false}
          height={64}
          radius={16}
          actionWidth={88}
          rowColor={selected ? "#f0f9ff" : "#ffffff"}
          textColor="#1e293b"
          drawerColor="#f1f5f9"
          actionColor={actionColor}
        >
          {children}
        </SwipeRow>
      ) : (
        // 동작이 없는 행 — SwipeRow와 같은 높이·여백·배경으로 맞춤
        <div
          className="flex h-16 items-center px-4 text-slate-800"
          style={{ background: selected ? "#f0f9ff" : "#ffffff" }}
          role="group"
          aria-label={label}
        >
          {children}
        </div>
      )}
    </div>
  );
}
