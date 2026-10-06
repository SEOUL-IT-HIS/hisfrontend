"use client";

import { useSelector } from "react-redux";
import { Alert } from "@/components/common";
import { selectIsDischarged } from "@/features/emergency/disposition/slice";
import { selectIsReceptionCancelled } from "@/features/emergency/receptionList/slice";

type DischargedNoticeProps = { receptionNo: string };

/**
 * 퇴실 처리가 끝난(Done) 환자 또는 접수에서 취소한(Cancelled) 접수에 새로 입력할 수 없다는 안내 — 병상 배정, KTAS·활력징후·격리·위험 스크리닝 등록, 처방 등록 패널에 둔다.
 * (백엔드도 같은 기준으로 409 로 막는다. 진료기록·처치·투약·CPR·동의 같은 사후 기록과 해제·취소는 퇴실 뒤에도 할 수 있다.)
 */
export default function DischargedNotice({ receptionNo }: DischargedNoticeProps) {
  const discharged = useSelector(selectIsDischarged(receptionNo));
  const cancelled = useSelector(selectIsReceptionCancelled(receptionNo));
  if (cancelled) {
    return (
      // 접수에서 취소한 접수입니다. 여기서는 새로 등록할 수 없습니다.
      <Alert variant="info" className="mb-2">
        This reception was cancelled. New entries cannot be registered here.
      </Alert>
    );
  }
  if (!discharged) return null;
  return (
    // 이 환자는 퇴실 처리가 끝났습니다. 여기서는 새로 등록할 수 없습니다.
    <Alert variant="info" className="mb-2">
      This patient has been discharged. New entries cannot be registered here.
    </Alert>
  );
}
