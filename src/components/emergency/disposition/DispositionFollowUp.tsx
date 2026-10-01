"use client";

import { useSelector } from "react-redux";
import { DISPOSITION } from "@/features/emergency/codes";
import { selectDispositionByReceptionId } from "@/features/emergency/disposition/slice";
import AdmissionRequestPanel from "@/components/emergency/disposition/AdmissionRequestPanel";
import TransferNotePanel from "@/components/emergency/disposition/TransferNotePanel";

type DispositionFollowUpProps = { receptionNo: string };

/**
 * 퇴실 결정 뒤 이어지는 조치 — 결정 유형에 따라 입원 요청(입원) 또는 전원 소견서(전원) 패널만 보여준다.
 * 다른 유형(귀가·사망·자의퇴원)은 후속 조치가 없다.
 */
export default function DispositionFollowUp({ receptionNo }: DispositionFollowUpProps) {
  const disposition = useSelector(selectDispositionByReceptionId(receptionNo));
  if (!disposition) return null;
  if (disposition.dispositionTypeCode === DISPOSITION.ADMIT) {
    return <AdmissionRequestPanel dispositionId={disposition.id} />;
  }
  if (disposition.dispositionTypeCode === DISPOSITION.TRANSFER) {
    return <TransferNotePanel dispositionId={disposition.id} />;
  }
  return null;
}
