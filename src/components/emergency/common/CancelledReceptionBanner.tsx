"use client";

import { useSelector } from "react-redux";
import { Alert } from "@/components/common";
import { selectIsReceptionCancelled } from "@/features/emergency/receptionList/slice";

type CancelledReceptionBannerProps = { receptionNo: string };

/**
 * 선택한 접수가 접수에서 취소됐다는 안내 — 탭과 상관없이 오른쪽 위에 항상 보인다.
 * (직원이 화면을 열어 둔 사이에 접수가 취소되면 목록에서는 사라지므로, 열어 둔 화면에서 이유를 알 수 있어야 한다.)
 */
export default function CancelledReceptionBanner({ receptionNo }: CancelledReceptionBannerProps) {
  const cancelled = useSelector(selectIsReceptionCancelled(receptionNo));
  if (!cancelled) return null;
  return (
    // 이 접수는 접수에서 취소되었습니다. 새로 등록할 수 없습니다. 다른 환자를 선택해 주세요.
    <Alert variant="error">
      This reception was cancelled at reception. New entries cannot be registered. Please select another patient.
    </Alert>
  );
}
