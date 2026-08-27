"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Panel } from "@/components/common";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import { ORDER_STATUS } from "@/features/surgery/order/types";
import {
  fetchOrdersRequest,
  selectOrderError,
  selectSurgeryOrders,
} from "@/features/surgery/order/slice";
import { SURGERY_STATUS } from "@/features/surgery/schedule/types";
import {
  fetchTodaySurgeriesRequest,
  selectScheduleError,
  selectTodaySurgeries,
} from "@/features/surgery/schedule/slice";

/**
 * 수술관리 진입 화면 (2026-08-24)
 *
 * <h3>왜 링크 나열을 걷어냈나</h3>
 *
 * <p>예전에는 메뉴 9개를 카드로 늘어놓았는데, 그 목록이 사이드바와 거의 같았다.
 * 같은 것을 두 군데서 보게 되니 화면만 하나 더 늘어난 셈이었고, 사이드바를 줄이면
 * 여기만 옛 메뉴를 계속 보여주며 어긋났다.</p>
 *
 * <p>대신 <b>지금 조치가 필요한 숫자</b>를 보여준다. 들어오자마자 "배정할 요청이
 * 몇 건인지"를 알 수 있으면 이 화면이 존재할 이유가 생긴다.</p>
 *
 * <h3>새 API 를 만들지 않았다</h3>
 *
 * <p>금일 수술은 {@code selectTodaySurgeries}, 배정 대기는 오더 목록을 접수(00)로 걸러
 * 센다. 둘 다 이미 있는 조회다. 요약 전용 API 를 만들면 백엔드에 집계 엔드포인트가
 * 하나 더 생기는데, 화면 하나 때문에 그럴 일은 아니다.</p>
 */

const STATUS_LABEL: { key: string; label: string }[] = [
  { key: SURGERY_STATUS.SCHEDULED, label: "예약" },
  { key: SURGERY_STATUS.IN_PROGRESS, label: "진행중" },
  { key: SURGERY_STATUS.COMPLETED, label: "완료" },
];

/** 지금 손이 필요한 곳으로 가는 길만 둔다 — 전체 메뉴는 사이드바가 갖는다 */
const SHORTCUTS = [
  { href: "/surgery/schedule/requests", label: "수술 요청 대기" },
  { href: "/surgery/worklist", label: "수술 업무" },
  { href: "/surgery/monitoring", label: "수술 현황" },
];

export default function SurgeryHome() {
  const dispatch = useDispatch<AppDispatch>();
  const today = useSelector(selectTodaySurgeries);
  const orders = useSelector(selectSurgeryOrders);
  const scheduleError = useSelector(selectScheduleError);
  const orderError = useSelector(selectOrderError);

  useEffect(() => {
    dispatch(fetchTodaySurgeriesRequest());
    dispatch(fetchOrdersRequest({ orderStatusCd: ORDER_STATUS.RECEIVED }));
  }, [dispatch]);

  const rows = today ?? [];
  const waiting = (orders ?? []).length;
  const emergencyWaiting = (orders ?? []).filter(
    (o) => o.emergencyYn === "Y",
  ).length;

  const error = scheduleError || orderError;

  return (
    <div className="flex flex-col gap-5">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* 배정 대기를 맨 앞에 둔다 — 유일하게 '지금 해야 할 일'이다 */}
        <Panel className="p-4">
          <p className="text-xs text-slate-500">배정 대기</p>
          <p className="mt-1 text-2xl font-medium text-slate-800">{waiting}</p>
          {emergencyWaiting > 0 ? (
            <p className="mt-1 text-xs text-rose-600">응급 {emergencyWaiting}건</p>
          ) : null}
        </Panel>

        {STATUS_LABEL.map((s) => (
          <Panel key={s.key} className="p-4">
            <p className="text-xs text-slate-500">금일 {s.label}</p>
            <p className="mt-1 text-2xl font-medium text-slate-800">
              {rows.filter((r) => r.statusCd === s.key).length}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:border-sky-400 hover:text-sky-600"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
