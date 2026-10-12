"use client";

import { useSelector } from "react-redux";
import { selectOrdersByReception } from "@/features/emergency/order/slice";
import { orderTitle, pendingVerbalOrders } from "@/features/emergency/order/utils";
import { formatDateTime } from "@/features/emergency/utils";

type UnconfirmedVerbalNoticeProps = { receptionNo: string };

/**
 * 퇴실 결정 화면의 안내 — 의사가 아직 확정하지 않은 구두처방이 있으면 알린다.
 * - 구두처방은 응급 상황에서 말로 지시한 것이라 사후 확정이 원칙이다. 확정은 퇴실 뒤에도 할 수 있어서 퇴실을 막지는 않고 알리기만 한다.
 * - 처방 목록은 Order 패널이 환자를 고를 때 불러와 저장소에 둔 것을 읽는다(여기서 다시 부르지 않는다).
 * - 확정 정보를 확인한 처방만 보여 준다(pendingVerbalOrders). 이미 확정한 처방을 미확정으로 잘못 알리지 않기 위해서다.
 */
export default function UnconfirmedVerbalNotice({ receptionNo }: UnconfirmedVerbalNoticeProps) {
  const orders = useSelector(selectOrdersByReception(receptionNo));
  const pending = pendingVerbalOrders(orders);
  if (!receptionNo || pending.length === 0) return null;

  return (
    <div role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
      <p className="font-medium">
        {/* 의사가 확정하지 않은 구두처방이 N건 있습니다 */}
        {pending.length} verbal order{pending.length > 1 ? "s" : ""} not yet confirmed by a physician
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
        {pending.map((order) => (
          <li key={order.orderId}>
            {orderTitle(orders, order.orderId) || "Order"}
            {order.prescribedAt ? ` · ${formatDateTime(order.prescribedAt)}` : ""}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-amber-700">
        {/* 퇴실 결정은 그대로 할 수 있습니다. Order 탭에서 확정하세요 — 퇴실 뒤에도 확정할 수 있습니다. */}
        You can still decide the disposition. Confirm them in the Order tab (Confirm Verbal Order) — confirmation is also possible after discharge.
      </p>
    </div>
  );
}
