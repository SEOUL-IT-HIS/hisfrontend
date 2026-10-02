"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useSelector } from "react-redux";
import { FormField, Input, Select } from "@/components/common";
import { optionLabel } from "@/features/emergency/codes";
import { selectOrderListStatus, selectOrdersByReception } from "@/features/emergency/order/slice";
import { ORDER_PRIORITY_FALLBACK_OPTIONS, type Order, type OrderItemType } from "@/features/emergency/order/types";
import { includesItemType, isOrderCancelled, shortOrderId } from "@/features/emergency/order/utils";
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

const MANUAL = "__manual__";

function describe(order: Order): string {
  const items = (order.items ?? []).map((item) => item.itemName).join(", ");
  const parts = [
    shortOrderId(order.orderId),
    items || order.status || "Order",
    order.priorityCode ? optionLabel(ORDER_PRIORITY_FALLBACK_OPTIONS, order.priorityCode) : "",
    order.prescribedAt ? formatDateTime(order.prescribedAt) : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

/**
 * 이 접수의 처방 중에서 처방ID를 고르는 선택 상자 (투약·처치 기록의 orderId).
 * - 목록은 Order 탭이 환자를 고를 때 처방코어에서 불러와 Redux 에 둔 것을 읽는다(여기서 다시 부르지 않는다).
 * - 취소된 처방은 뺀다. itemType 이 있으면 그 종류의 항목이 있는 처방만(항목을 모르는 처방은 포함).
 * - 목록을 못 불러왔거나 찾는 처방이 없으면 "Enter ID manually" 로 직접 입력할 수 있다.
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
  const [manual, setManual] = useState(false);

  // 환자를 바꾸면 이전 환자의 처방ID가 남아 있지 않게 비운다(다른 환자 처방에 기록되는 것을 막는다).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setManual(false);
  }
  useEffect(() => {
    onChangeRef.current("");
  }, [receptionNo]);

  const candidates = orders.filter((order) => {
    if (isOrderCancelled(order)) return false;
    return !itemType || includesItemType(order, itemType) !== false;
  });
  const options = [
    ...candidates.map((order) => ({ value: order.orderId, label: describe(order) })),
    { value: MANUAL, label: "Enter ID manually..." },
  ];
  // 목록에 없는 값이 들어 있으면(직접 입력 등) 직접 입력 모드로 본다.
  const manualMode = manual || (!!value && !candidates.some((order) => order.orderId === value));

  function handleSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === MANUAL) {
      setManual(true);
      onChange("");
      return;
    }
    setManual(false);
    onChange(e.target.value);
  }

  const hint =
    listStatus === "loading"
      ? "Loading this patient's orders..."
      : listStatus === "error"
        ? "Could not load the order list. Enter the ID manually."
        : candidates.length === 0
          ? "No orders for this patient. Register one in the Order tab, or enter the ID manually."
          : "Choose from this patient's orders (Order tab).";

  return (
    <FormField label="Order" required hint={hint} className={className}>
      <div className="flex flex-col gap-2">
        <Select
          value={manualMode ? MANUAL : value}
          onChange={handleSelect}
          options={options}
          placeholder="Select an order"
          disabled={disabled || !receptionNo}
        />
        {manualMode ? (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Order ID (36 characters)"
            maxLength={36}
            disabled={disabled}
          />
        ) : null}
      </div>
    </FormField>
  );
}
