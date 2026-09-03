"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, FormActions, FormField, Input, Modal, Select } from "@/components/common";
import {
  cancelReceptionRequest,
  selectCancelLoading,
  selectCancelError,
} from "@/features/reception/receptionmanagement/slice";
import type { AppDispatch, RootState } from "@/store/store";

const CANCEL_REASON_OPTIONS = [
  { value: "PATIENT_REQUEST", label: "Patient Request" },
  { value: "DUPLICATE", label: "Duplicate Reception" },
  { value: "MISTAKE", label: "Registration Error" },
  { value: "ETC", label: "Other" },
];

type ReceptionCancelModalProps = {
  receptionId: string | null;
  onClose: () => void;
};

/**
 * 접수 취소 모달
 * - 접수 목록의 [취소] 버튼으로 열린다.
 */
export default function ReceptionCancelModal({
  receptionId,
  onClose,
}: ReceptionCancelModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const cancelLoading = useSelector(selectCancelLoading);
  const cancelError = useSelector(selectCancelError);

  const [cancelReasonCode, setCancelReasonCode] = useState("PATIENT_REQUEST");
  const [cancelReasonDetail, setCancelReasonDetail] = useState("");

  /** 이번 취소 시도에 대한 응답을 기다리는 중인지 — 성공 시에만 모달을 닫기 위함 */
  const waitCancel = useRef(false);

  useEffect(() => {
    if (!waitCancel.current) return;
    if (cancelLoading) return;
    waitCancel.current = false;
    if (!cancelError) {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelLoading, cancelError]);

  function handleClose() {
    setCancelReasonCode("PATIENT_REQUEST");
    setCancelReasonDetail("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receptionId) return;

    waitCancel.current = true;
    dispatch(
      cancelReceptionRequest({
        receptionId,
        cancelReasonCode,
        cancelReasonDetail: cancelReasonDetail.trim() || undefined,
        cancelledBy: authUser?.loginId ?? "",
      }),
    );
  }

  return (
    <Modal
      open={receptionId !== null}
      title="Cancel Reception"
      closeDisabled={cancelLoading}
      onClose={handleClose}
      maxWidthClassName="max-w-md"
    >
      {cancelError ? (
        <div className="mb-3">
          <Alert variant="error">{cancelError}</Alert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Cancellation Reason" required htmlFor="cancelReasonCode">
          <Select
            id="cancelReasonCode"
            value={cancelReasonCode}
            onChange={(e) => setCancelReasonCode(e.target.value)}
            options={CANCEL_REASON_OPTIONS}
          />
        </FormField>

        <FormField label="Detailed Reason" htmlFor="cancelReasonDetail">
          <Input
            id="cancelReasonDetail"
            value={cancelReasonDetail}
            placeholder="Enter a detailed reason (optional)"
            onChange={(e) => setCancelReasonDetail(e.target.value)}
          />
        </FormField>

        <FormActions
          onCancel={handleClose}
          cancelLabel="Cancel"
          submitLabel="Cancel Reception"
          loadingLabel="Cancelling…"
          loading={cancelLoading}
        />
      </form>
    </Modal>
  );
}
