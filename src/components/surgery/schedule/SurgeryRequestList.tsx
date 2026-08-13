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
import type { Surgery } from "@/features/surgery/schedule/types";
import {
  cancelSurgeryRequest,
  fetchSurgeryRequestsRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSurgeryRequests,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 요청 대기 목록 (요청접수 00)
 *
 * <p>진료(일반)와 응급실(응급)에서 올라온 요청 중 아직 수술실이 잡히지 않은 건이다.
 * 수술실 담당자가 배정하면 예약(01)이 되어 이 목록에서 빠진다. 응급 건이 위로 오도록
 * 백엔드가 정렬해 내려주므로 화면에서 다시 정렬하지 않는다.</p>
 *
 * <p>환자명·집도의명을 표시하지 않는 이유 — 환자·직원 서비스가 소유한 데이터라 수술이
 * 저장하지 않으며(§14.1), 표시하려면 각 서비스 API 를 호출해야 한다(§21.9).</p>
 *
 * <p>여기서의 취소는 업무상 '반려'다. 행을 지우지 않고 취소(04) 상태로 전이시킨다(§21.6).</p>
 *
 * <p>표·배지·버튼은 components/common 을 쓴다(§12.1). 응급 구분은 직접 만든 뱃지 대신
 * StatusBadge 를 쓴다 — 색과 모양이 다른 서비스 목록과 같아진다.</p>
 *
 * <p><b>반려 사유(SL2-227)</b> — 버튼을 누르면 바로 반려하지 않고 사유를 고르는 창을 띄운다.
 * 되돌릴 수 없는 조작이라 한 번 더 확인받는 편이 낫고, 사유를 남겨야 나중에 "왜 반려됐나"에
 * 답할 수 있다. 사유는 이력에 함께 저장된다(SL2-233).</p>
 *
 * <p>사유 코드 그룹(SURGERY_CANCEL_CD)이 admin 에 아직 없으면 선택지가 비어 보인다.
 * 그때도 사유 없이 반려할 수 있게 열어둔다 — 코드 등록 전이라고 업무를 막을 수는 없다.
 * 백엔드도 같은 판단으로 그룹이 없으면 검증을 건너뛴다.</p>
 */
export default function SurgeryRequestList() {
  const dispatch = useDispatch<AppDispatch>();
  const requests = useSelector(selectSurgeryRequests);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  // 반려 대상과 사유. 대상이 있으면 창이 열린 상태다.
  const [rejectTarget, setRejectTarget] = useState<Surgery | null>(null);
  const [reasonCd, setReasonCd] = useState("");

  const { options: reasonOptions } = useCommonCodeOptions("SURGERY_CANCEL_CD");

  useEffect(() => {
    dispatch(fetchSurgeryRequestsRequest());
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
      cancelSurgeryRequest(
        rejectTarget.surgeryId,
        // 빈 값이면 아예 보내지 않는다 — 백엔드가 본문 없는 호출을 허용한다
        reasonCd ? { cancelReasonCd: reasonCd } : undefined,
      ),
    );
    closeReject();
  }

  const columns: DataTableColumn<Surgery>[] = [
    {
      key: "emergencyYn",
      header: "구분",
      render: (s) => (
        <StatusBadge
          value={s.emergencyYn}
          activeLabel="응급"
          inactiveLabel="일반"
        />
      ),
    },
    { key: "surgeryDt", header: "희망 수술일", render: (s) => s.surgeryDt },
    { key: "surgeryName", header: "수술명", render: (s) => s.surgeryName ?? "-" },
    { key: "patientId", header: "환자ID", render: (s) => s.patientId },
    { key: "surgeonId", header: "집도의ID", render: (s) => s.surgeonId },
    {
      key: "roomCode",
      header: "희망 수술실",
      // 진료가 희망 수술실을 지정했더라도 확정은 배정 단계에서 한다
      render: (s) => s.roomCode ?? "-",
    },
    {
      key: "createdAt",
      header: "요청일시",
      render: (s) => s.createdAt?.slice(0, 10) ?? "-",
    },
    {
      key: "actions",
      header: "처리",
      render: (s) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/surgery/schedule/assign/${s.surgeryId}`}
            className="text-sky-600 underline"
          >
            배정
          </Link>
          <Button
            variant="ghost"
            disabled={saving}
            className="h-8 px-2"
            onClick={() => setRejectTarget(s)}
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
        rows={requests}
        rowKey={(s) => s.surgeryId}
        loading={loading}
        emptyMessage="배정 대기 중인 요청이 없습니다."
        minWidthClassName="min-w-[920px]"
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
            htmlFor="cancelReasonCd"
            hint={
              reasonOptions.length === 0
                ? "사유 코드가 아직 등록되지 않아 사유 없이 반려됩니다."
                : "선택하지 않으면 사유 없이 반려됩니다."
            }
          >
            <Select
              id="cancelReasonCd"
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
