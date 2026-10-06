"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import DownSelect from "@/components/emergency/common/DownSelect";
import { optionLabel } from "@/features/emergency/codes";
import { selectOrderListStatus, selectOrdersByReception } from "@/features/emergency/order/slice";
import { ORDER_PRIORITY_FALLBACK_OPTIONS, type Order, type OrderItemType } from "@/features/emergency/order/types";
import { includesItemType, isOrderCancelled } from "@/features/emergency/order/utils";
import { formatDateTime } from "@/features/emergency/utils";

type OrderSelectProps = {
  receptionNo: string;
  /** 선택된 처방ID (없으면 "") */
  value: string;
  onChange: (orderId: string) => void;
  disabled?: boolean;
  /** 이 종류의 항목이 있는 처방만 보여준다(예: 투약은 약품). 항목을 아직 모르는 처방은 넣는다. */
  itemType?: OrderItemType;
  className?: string;
};

/** 목록에 보이는 이름 — 처방 ID 는 사용자가 알 필요가 없어 항목 이름·우선순위·시각만 보여준다 */
function describe(order: Order): string {
  const items = (order.items ?? []).map((item) => item.itemName).join(", ");
  const parts = [
    items || order.status || "Order",
    order.priorityCode ? optionLabel(ORDER_PRIORITY_FALLBACK_OPTIONS, order.priorityCode) : "",
    order.prescribedAt ? formatDateTime(order.prescribedAt) : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

/**
 * 이 접수의 처방 중에서 처방을 고르는 선택 상자 (투약·처치 기록이 참조하는 처방, 저장되는 값은 처방 ID).
 * - 목록은 Order 패널이 환자를 고를 때 처방코어에서 불러와 Redux 에 둔 것을 읽는다(탭은 숨겨질 뿐 항상 마운트돼 있다). 여기서 다시 부르지 않는다.
 * - 취소된 처방은 뺀다. itemType 이 있으면 그 종류의 항목이 있는 처방만(항목을 모르는 처방은 포함).
 * - 처방 ID 를 직접 입력하는 칸은 없다. 처방이 없으면 Order 탭에서 먼저 등록한다.
 */
export default function OrderSelect({
  receptionNo,
  value,
  onChange,
  disabled = false,
  itemType,
  className = "w-[300px]",
}: OrderSelectProps) {
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const listStatus = useSelector(selectOrderListStatus(receptionNo));

  // 환자를 바꾸면 이전 환자의 처방이 남아 있지 않게 비운다(다른 환자 처방에 기록되는 것을 막는다).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
  }
  useEffect(() => {
    onChangeRef.current("");
  }, [receptionNo]);

  const candidates = orders.filter((order) => {
    if (isOrderCancelled(order)) return false;
    return !itemType || includesItemType(order, itemType) !== false;
  });
  const options = candidates.map((order) => ({ value: order.orderId, label: describe(order) }));

  const hint =
    listStatus === "loading"
      ? "Loading this patient's orders..."
      : listStatus === "error"
        ? "Could not load the order list. Press Refresh List in the Order tab."
        : candidates.length === 0
          ? "No orders for this patient yet. Register one in the Order tab first."
          : "Choose from this patient's orders (Order tab).";

  return (
    <DownSelect
      label="Order"
      required
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select an order"
      disabled={disabled || !receptionNo}
      hint={hint}
      className={className}
    />
  );
}
