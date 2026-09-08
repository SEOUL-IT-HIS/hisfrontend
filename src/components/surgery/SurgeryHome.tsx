"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Panel } from "@/components/common";
import TodaySurgeryBoard from "@/components/surgery/schedule/TodaySurgeryBoard";
import SurgeryAssignForm from "@/components/surgery/schedule/SurgeryAssignForm";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import { ORDER_STATUS } from "@/features/surgery/order/types";
import {
  clearAssignedSurgery,
  fetchOrdersRequest,
  selectAssignedSurgeryId,
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
 * 수술관리 진입 화면
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
 *
 * <h3>모니터링 화면을 여기로 합쳤다</h3>
 *
 * <p>{@code /surgery/monitoring} 은 금일 수술 목록 하나만 보여주는 화면이었다.
 * 그런데 이 홈이 이미 같은 조회({@code fetchTodaySurgeriesRequest})로 금일 건수를
 * 세고 있었다 — <b>같은 데이터를 두 화면이 각자 받아다 절반씩 보여주고</b> 있었던
 * 셈이다. 홈에서 "금일 진행중 3건"을 보고 그 3건이 뭔지 알려면 메뉴를 하나 더
 * 눌러야 했다.</p>
 *
 * <p>이제 숫자 바로 아래에 그 목록이 있다. {@code /surgery/monitoring} 라우트는
 * 지웠다 — 사이드바의 'OR Monitoring' 메뉴가 지워질 때까지는 그 메뉴를 누르면 404 다.
 * 메뉴 테이블이 admin-service DB 소유라 우리가 못 지우고, 삭제를 따로 요청해 두었다.
 * 리다이렉트로 가려 두지 않은 이유는 같은 사정으로 깨져 있는 메뉴가 셋 더 있어서다
 * (OR Checklist·Consent·Records — 수술 업무 탭으로 합치면서 라우트를 지웠다).
 * 넷 중 하나만 가리면 admin 쪽에서 남은 셋의 삭제가 덜 급해 보인다.</p>
 */

const STATUS_LABEL: { key: string; label: string }[] = [
  { key: SURGERY_STATUS.SCHEDULED, label: "Scheduled" },
  { key: SURGERY_STATUS.IN_PROGRESS, label: "In progress" },
  { key: SURGERY_STATUS.COMPLETED, label: "Completed" },
];

/**
 * 지금 손이 필요한 곳으로 가는 길만 둔다 — 전체 메뉴는 사이드바가 갖는다.
 *
 * <p>'수술 현황'이 빠졌다 — 그 화면이 이 화면 안으로 들어왔다. '배정 대기'도
 * 뺐다 — 대기 건이 아래 표에 직접 나오고 거기서 바로 배정하므로, 링크를 남겨 두면
 * 같은 일을 하는 길이 둘이 된다.</p>
 */
const SHORTCUTS = [
  { href: "/surgery/worklist", label: "Surgery worklist" },
  { href: "/surgery/schedule", label: "Surgery assignment" },
];

export default function SurgeryHome() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const today = useSelector(selectTodaySurgeries);
  const orders = useSelector(selectSurgeryOrders);
  const scheduleError = useSelector(selectScheduleError);
  const orderError = useSelector(selectOrderError);
  const assignedSurgeryId = useSelector(selectAssignedSurgeryId);

  /** 배정 폼을 띄울 오더. null 이면 폼이 없다 */
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  useEffect(() => {
    /*
      들어오자마자 이전 배정 결과를 비운다.

      배정 대기 목록(/surgery/schedule/requests)에서 배정해도 같은 값이 store 에
      남는데, 그쪽 화면은 이 값을 안 쓰고 비우지도 않는다. 안 비우고 두면
      나중에 홈에 들어왔을 때 그 값을 보고 엉뚱한 수술로 튄다.

      그래서 "이 화면에 머무는 동안 새로 생긴 배정"만 이동으로 이어진다.
    */
    dispatch(clearAssignedSurgery());
    dispatch(fetchTodaySurgeriesRequest());
    dispatch(fetchOrdersRequest({ orderStatusCd: ORDER_STATUS.RECEIVED }));
  }, [dispatch]);

  /**
   * 배정이 끝나면 그 수술로 이어서 넘어간다.
   *
   * <p>배정만 하고 끝나는 일은 거의 없다 — 동의서를 받고 체크리스트를 열고
   * 시작을 눌러야 한다. 그게 전부 수술 업무 화면에 있으므로 거기로 보내고,
   * 방금 만든 수술이 선택된 채로 열리게 한다.</p>
   *
   * <p>보내기 전에 slice 의 값을 비운다 — 안 비우면 홈에 다시 들어올 때
   * 남아 있는 값을 보고 또 이동한다.</p>
   */
  useEffect(() => {
    if (!assignedSurgeryId) return;
    const surgeryId = assignedSurgeryId;
    dispatch(clearAssignedSurgery());
    // 폼 상태는 따로 닫지 않는다 — 다른 라우트로 나가면서 이 화면이 언마운트된다.
    // 효과 안에서 setState 를 부르면 불필요한 재렌더가 한 번 더 돈다.
    router.push(`/surgery/worklist?surgeryId=${surgeryId}`);
  }, [assignedSurgeryId, dispatch, router]);

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
          <p className="text-xs text-slate-500">Pending assignment</p>
          <p className="mt-1 text-2xl font-medium text-slate-800">{waiting}</p>
          {emergencyWaiting > 0 ? (
            <p className="mt-1 text-xs text-rose-600">{emergencyWaiting} emergency</p>
          ) : null}
        </Panel>

        {STATUS_LABEL.map((s) => (
          <Panel key={s.key} className="p-4">
            <p className="text-xs text-slate-500">Today · {s.label}</p>
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

      {/*
        배정 폼. 표에서 Assign 을 누르면 여기 나타난다.

        화면을 옮기지 않는 이유 — 배정 대기 목록으로 보냈다가 다시 돌아오게 하면
        홈에서 시작한 일이 두 화면을 거친다. 확정하면 어차피 수술 업무로 넘어가므로
        중간 경유지를 만들 이유가 없다.
      */}
      {assigningOrderId ? (
        <Panel className="p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">
            Assign surgery
          </h2>
          {/*
            onAssigned 를 반드시 준다 — 주지 않으면 폼이 기본 동작으로
            /surgery/schedule/requests 로 이동한다. 여기서는 폼만 닫고,
            수술 업무로 넘기는 일은 위 assignedSurgeryId 효과가 맡는다
            (그쪽이 방금 만들어진 수술 ID 를 알고 있다).
          */}
          <SurgeryAssignForm
            key={assigningOrderId}
            orderId={assigningOrderId}
            onAssigned={() => setAssigningOrderId(null)}
            onCancel={() => setAssigningOrderId(null)}
          />
        </Panel>
      ) : null}

      {/* 위 카드가 센 그 건들의 목록. 같은 조회 결과를 쓰므로 요청이 늘지 않는다 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Today&apos;s surgeries and pending orders
        </h2>
        <TodaySurgeryBoard
          onAssign={setAssigningOrderId}
          onOpen={(surgeryId) =>
            router.push(`/surgery/worklist?surgeryId=${surgeryId}`)
          }
        />
      </div>
    </div>
  );
}
