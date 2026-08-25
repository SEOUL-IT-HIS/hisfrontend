"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  Alert,
  Button,
  DataTable,
  FormActions,
  FormField,
  Modal,
  Select,
  StatusBadge,
  type DataTableColumn,
} from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchOrdersRequest,
  rejectOrderRequest,
  selectOrderError,
  selectOrderLoading,
  selectOrderSaving,
  selectSurgeryOrders,
} from "@/features/surgery/order/slice";
import { ORDER_STATUS, type SurgeryOrder } from "@/features/surgery/order/types";

/**
 * 수술 요청(오더) 대기 목록 (SL2-225)
 *
 * <p>진료(일반)와 응급실(응급)에서 올라온 <b>요청</b> 중 아직 수술실이 잡히지 않은 건이다.
 * 배정하면 수락(01)이 되어 이 목록에서 빠지고, 그때 비로소 수술이 만들어진다.</p>
 *
 * <p><b>수술이 아니라 오더를 본다</b>(2026-08-13) — 예전에는 요청도 수술 행이라
 * 이 화면이 수술 목록을 상태로 걸러 보여줬다. 이제 SURGERY_ORDER 를 본다.
 * 반려된 요청은 수술이 되지 않으므로 수술 통계에 섞이지 않는다.</p>
 *
 * <p>환자명·집도의명을 표시하지 않는 이유 — 환자·직원 서비스가 소유한 데이터라 수술이
 * 저장하지 않으며(§14.1), 표시하려면 각 서비스 API 를 호출해야 한다(§21.9).</p>
 *
 * <p>응급 건이 위로 오도록 백엔드가 정렬해 내려주므로 화면에서 다시 정렬하지 않는다.</p>
 *
 * <p><b>반려 사유(SL2-227)</b> — 버튼을 누르면 바로 반려하지 않고 사유를 고르는 창을 띄운다.
 * 되돌릴 수 없는 조작이라 한 번 더 확인받는 편이 낫고, 사유를 남겨야 나중에 "왜 반려됐나"에
 * 답할 수 있다. 사유 코드 그룹(SURGERY_ORDER_REJECT_CD)이 admin 에 아직 없으면 선택지가
 * 비어 보이는데, 그때도 사유 없이 반려할 수 있게 열어둔다 — 코드 등록 전이라고 업무를
 * 막을 수는 없고, 백엔드도 같은 판단으로 그룹이 없으면 검증을 건너뛴다.</p>
 */
export default function SurgeryRequestList() {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector(selectSurgeryOrders);
  const loading = useSelector(selectOrderLoading);
  const saving = useSelector(selectOrderSaving);
  const error = useSelector(selectOrderError);

  // 반려 대상과 사유. 대상이 있으면 창이 열린 상태다.
  const [rejectTarget, setRejectTarget] = useState<SurgeryOrder | null>(null);
  const [reasonCd, setReasonCd] = useState("");

  const { options: reasonOptions } = useCommonCodeOptions(
    "SURGERY_ORDER_REJECT_CD",
  );

  useEffect(() => {
    // 접수(00) 상태만 — 이미 처리된 오더는 대기 목록에 뜰 이유가 없다
    dispatch(fetchOrdersRequest({ orderStatusCd: ORDER_STATUS.RECEIVED }));
  }, [dispatch]);

  function closeReject() {
    setRejectTarget(null);
    setReasonCd("");
  }

  function confirmReject() {
    if (!rejectTarget) {
      return;
    }
    dispatch(
      rejectOrderRequest(
        rejectTarget.orderId,
        // 빈 값이면 아예 보내지 않는다 — 백엔드가 본문 없는 호출을 허용한다
        reasonCd ? { rejectReasonCd: reasonCd } : undefined,
      ),
    );
    closeReject();
  }

  const columns: DataTableColumn<SurgeryOrder>[] = [
    {
      key: "emergencyYn",
      header: "구분",
      render: (o) => (
        <StatusBadge
          value={o.emergencyYn}
          activeLabel="응급"
          inactiveLabel="일반"
        />
      ),
    },
    { key: "requestedDt", header: "희망 수술일", render: (o) => o.requestedDt },
    { key: "surgeryName", header: "수술명", render: (o) => o.surgeryName ?? "-" },
    { key: "patientId", header: "환자ID", render: (o) => o.patientId },
    { key: "surgeonId", header: "집도의ID", render: (o) => o.surgeonId },
    {
      key: "visitId",
      header: "내원ID",
      // 청구 연동(SL2-72)에 필요한 값이라 비어 있으면 눈에 띄게 둔다
      render: (o) => o.visitId ?? "-",
    },
    {
      key: "createdAt",
      header: "요청일시",
      render: (o) => o.createdAt?.slice(0, 10) ?? "-",
    },
    {
      key: "actions",
      header: "처리",
      render: (o) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/surgery/schedule/assign/${o.orderId}`}
            className="text-sky-600 underline"
          >
            배정
          </Link>
          <Button
            variant="ghost"
            disabled={saving}
            className="h-8 px-2"
            onClick={() => setRejectTarget(o)}
          >
            반려
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{resolveSurgeryMessage(error)}</Alert> : null}

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(o) => o.orderId}
        loading={loading}
        emptyMessage="배정 대기 중인 요청이 없습니다."
        minWidthClassName="min-w-[960px]"
      />

      <Modal
        open={rejectTarget !== null}
        title="수술 요청 반려"
        onClose={closeReject}
        maxWidthClassName="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmReject();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-slate-700">
            {rejectTarget?.surgeryName ?? "수술명 미입력"} (환자{" "}
            {rejectTarget?.patientId}) 요청을 반려합니다.
          </p>

          <FormField
            label="반려 사유"
            htmlFor="rejectReasonCd"
            hint={
              reasonOptions.length === 0
                ? "사유 코드가 아직 등록되지 않아 사유 없이 반려됩니다."
                : "선택하지 않으면 사유 없이 반려됩니다."
            }
          >
            <Select
              id="rejectReasonCd"
              placeholder="사유 선택 안 함"
              options={reasonOptions}
              value={reasonCd}
              onChange={(e) => setReasonCd(e.target.value)}
              disabled={saving || reasonOptions.length === 0}
            />
          </FormField>

          <FormActions
            onCancel={closeReject}
            cancelLabel="닫기"
            submitLabel="반려"
            loading={saving}
            loadingLabel="반려 중…"
          />
        </form>
      </Modal>
    </div>
  );
}
