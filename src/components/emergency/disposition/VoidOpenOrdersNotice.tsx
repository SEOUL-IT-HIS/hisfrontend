"use client";

import { useSelector } from "react-redux";
import { selectOrdersByReception } from "@/features/emergency/order/slice";
import { openOrders, orderTitle } from "@/features/emergency/order/utils";
import { formatDateTime } from "@/features/emergency/utils";

type VoidOpenOrdersNoticeProps = { receptionNo: string };

/**
 * 오접수·중복 접수(06)로 닫기 전의 안내 — 취소하지 않은 처방이 있으면 알린다.
 * 06 으로 닫아도 이미 처방코어·검사·약제로 나간 처방은 자동으로 취소되지 않아, 접수는 취소됐는데 검사실·약제가 그 처방을 계속
 * 처리하게 된다. 막지는 않고(이미 결과가 나온 처방일 수도 있다) 먼저 Order 탭에서 취소하도록 알린다.
 * 처방 목록은 Order 패널이 환자를 고를 때 불러와 저장소에 둔 것을 읽는다(여기서 다시 부르지 않는다).
 */
export default function VoidOpenOrdersNotice({ receptionNo }: VoidOpenOrdersNoticeProps) {
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const open = openOrders(orders);
  if (!receptionNo || open.length === 0) return null;

  return (
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <p className="font-medium">
        {/* 취소하지 않은 처방이 N건 있습니다 */}
        {open.length} order{open.length > 1 ? "s" : ""} not cancelled
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
        {open.map((order) => (
          <li key={order.orderId}>
            {orderTitle(orders, order.orderId) || "Order"}
            {order.prescribedAt ? ` · ${formatDateTime(order.prescribedAt)}` : ""}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-amber-700">
        {/* 접수를 닫아도 이미 검사실·약제로 나간 처방은 자동으로 취소되지 않습니다. 필요하면 Order 탭에서 먼저 취소하세요. */}
        Closing the reception does not cancel orders already sent to the lab or pharmacy. Cancel them in the Order tab first if they
        are not needed. You can still continue.
      </p>
    </div>
  );
}
