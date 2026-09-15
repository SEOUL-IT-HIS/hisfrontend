"use client";

/**
 * 카카오페이 결제창에서 사용자가 결제를 취소하고 돌아오는 콜백 화면.
 * 백엔드 kakaopay.cancel-url 이 이 경로를 가리킨다.
 * 결제 자체가 성사되지 않은 상태라 별도 API 호출 없이 안내만 띄운다.
 */
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/common";

const KakaoPayCancel = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Alert variant="info">Payment was canceled.</Alert>
      <Button variant="primary" onClick={() => router.push("/billing/payment")}>
        Back to Payment
      </Button>
    </div>
  );
};

export default KakaoPayCancel;
