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

const RECEPTION_TYPE_LABEL: Record<string, string> = {
  INITIAL: "초진",
  REVISIT: "재진",
};

type ReceptionDetailModalProps = {
  receptionId: string | null;
  onClose: () => void;
};

/**
 * 접수 상세 조회 모달
 * - 접수 목록의 [상세] 버튼으로 열린다.
 */
export default function ReceptionDetailModal({
  receptionId,
  onClose,
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
      title="접수 상세"
      onClose={handleClose}
      maxWidthClassName="max-w-lg"
    >
      {detailLoading ? (
        <p className="py-8 text-center text-sm text-slate-400">
          불러오는 중입니다...
        </p>
      ) : detailError ? (
        <Alert variant="error">{detailError}</Alert>
      ) : detail ? (
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-400">환자명</dt>
          <dd className="col-span-2 text-slate-800">{detail.patientName}</dd>

          <dt className="text-slate-400">진료과</dt>
          <dd className="col-span-2 text-slate-800">{detail.deptName}</dd>

          <dt className="text-slate-400">담당의</dt>
          <dd className="col-span-2 text-slate-800">{detail.doctorName}</dd>

          <dt className="text-slate-400">접수구분</dt>
          <dd className="col-span-2 text-slate-800">
            {RECEPTION_TYPE_LABEL[detail.receptionType] ??
              detail.receptionType}
          </dd>

          <dt className="text-slate-400">접수일시</dt>
          <dd className="col-span-2 text-slate-800">
            {detail.receptionDate}
          </dd>

          <dt className="text-slate-400">상태</dt>
          <dd className="col-span-2 text-slate-800">{detail.status}</dd>

          <dt className="text-slate-400">메모</dt>
          <dd className="col-span-2 whitespace-pre-wrap text-slate-800">
            {detail.memo || "-"}
          </dd>
        </dl>
      ) : null}
    </Modal>
  );
}
