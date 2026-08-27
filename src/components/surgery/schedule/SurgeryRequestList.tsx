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
 * 답할 수 있다.</p>
 *
 * <p><b>사유는 필수다</b>(2026-08-26). 예전에는 선택이었는데, 사유 코드 그룹
 * (SURGERY_ORDER_REJECT_CD)이 admin 에 없어 필수로 두면 고를 값이 없었기 때문이다.
 * 2026-08-25 에 등록해 그 이유가 사라졌고, 수술 취소(SL2-178)와 같은 판단으로 맞췄다.</p>
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
    // 사유는 필수다(2026-08-26) — 백엔드 @NotBlank 가 400 으로 막으므로 화면에서 먼저 거른다.
    //   버튼도 잠가 두지만, 폼 제출(Enter)로도 들어올 수 있어 여기서 한 번 더 본다.
    if (!rejectTarget || !reasonCd) {
      return;
    }
    dispatch(rejectOrderRequest(rejectTarget.orderId, { rejectReasonCd: reasonCd }));
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
          {/*
            배정을 버튼으로 바꿨다(2026-08-26) — 밑줄 링크였는데, 같은 칸의 '반려'는
            버튼이라 생김새가 갈렸다. 배정이 더 중요한 동작인데 오히려 약해 보였다.
            이동이 일어나므로 Link 를 감싸 접근성(새 탭 열기 등)은 그대로 둔다.
          */}
          <Link href={`/surgery/schedule/assign/${o.orderId}`}>
            <Button variant="primary" className="h-8 px-3">
              배정
            </Button>
          </Link>
          <Button
            variant="secondary"
            disabled={saving}
            className="h-8 px-3"
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
            required
            hint={
              reasonOptions.length === 0
                ? "사유 코드를 불러오지 못했습니다. admin 서비스를 확인하세요."
                : undefined
            }
          >
            {/*
              코드를 못 불러와도 셀렉트를 잠그지 않는다 — 예전에는 잠갔는데, 그러면
              admin 이 잠깐 죽었을 때 반려 업무 자체가 멈춘다. 대신 아래 버튼이
              값 없이는 안 눌리므로 잘못 보내지는 일은 없다.
            */}
            <Select
              id="rejectReasonCd"
              placeholder="선택"
              options={reasonOptions}
              value={reasonCd}
              onChange={(e) => setReasonCd(e.target.value)}
              disabled={saving}
            />
          </FormField>

          <FormActions
            onCancel={closeReject}
            cancelLabel="닫기"
            submitLabel="반려"
            submitDisabled={!reasonCd}
            loading={saving}
            loadingLabel="반려 중…"
          />
        </form>
      </Modal>
    </div>
  );
}
