"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Modal } from "@/components/common";
import {
  fetchReceptionDetailRequest,
  clearReceptionDetail,
  selectReceptionDetail,
  selectReceptionDetailLoading,
  selectReceptionDetailError,
} from "@/features/reception/receptionmanagement/slice";
import type { AppDispatch } from "@/store/store";

const VISIT_TYPE_LABEL: Record<string, string> = {
  INITIAL: "Initial Visit",
  REVISIT: "Follow-up Visit",
};

const RECEPTION_TYPE_LABEL: Record<string, string> = {
  RESERVATION: "Reservation",
  WALK_IN: "Walk-in",
  EMERGENCY: "Emergency",
};

type ReceptionDetailModalProps = {
  receptionId: string | null;
  onClose: () => void;
  /** 초진/재진 행 표시 여부 — 응급 접수는 구분이 없어 false 로 숨긴다 */
  showVisitType?: boolean;
};

/**
 * 접수 상세 조회 모달
 * - 접수 목록의 [상세] 버튼으로 열린다.
 */
export default function ReceptionDetailModal({
  receptionId,
  onClose,
  showVisitType = true,
}: ReceptionDetailModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectReceptionDetail);
  const detailLoading = useSelector(selectReceptionDetailLoading);
  const detailError = useSelector(selectReceptionDetailError);

  useEffect(() => {
    if (receptionId) {
      dispatch(fetchReceptionDetailRequest(receptionId));
    }
  }, [receptionId, dispatch]);

  function handleClose() {
    dispatch(clearReceptionDetail());
    onClose();
  }

  return (
    <Modal
      open={receptionId !== null}
      title="Reception Details"
      onClose={handleClose}
      maxWidthClassName="max-w-lg"
    >
      {detailLoading ? (
        <p className="py-8 text-center text-sm text-slate-400">
          Loading...
        </p>
      ) : detailError ? (
        <Alert variant="error">{detailError}</Alert>
      ) : detail ? (
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-400">Patient Name</dt>
          <dd className="col-span-2 text-slate-800">{detail.patientName}</dd>

          <dt className="text-slate-400">Department</dt>
          <dd className="col-span-2 text-slate-800">{detail.deptName}</dd>

          <dt className="text-slate-400">Doctor</dt>
          <dd className="col-span-2 text-slate-800">
            {detail.doctorName || "-"}
          </dd>

          <dt className="text-slate-400">Reception Type</dt>
          <dd className="col-span-2 text-slate-800">
            {RECEPTION_TYPE_LABEL[detail.receptionType] ??
              detail.receptionType}
          </dd>

          {showVisitType ? (
            <>
              <dt className="text-slate-400">Visit Type</dt>
              <dd className="col-span-2 text-slate-800">
                {detail.visitType
                  ? VISIT_TYPE_LABEL[detail.visitType] ?? detail.visitType
                  : "-"}
              </dd>
            </>
          ) : null}

          <dt className="text-slate-400">Reception Date</dt>
          <dd className="col-span-2 text-slate-800">
            {detail.receptionDate}
          </dd>

          <dt className="text-slate-400">Status</dt>
          <dd className="col-span-2 text-slate-800">{detail.status}</dd>

          <dt className="text-slate-400">Memo</dt>
          <dd className="col-span-2 whitespace-pre-wrap text-slate-800">
            {detail.memo || "-"}
          </dd>
        </dl>
      ) : null}
    </Modal>
  );
}
