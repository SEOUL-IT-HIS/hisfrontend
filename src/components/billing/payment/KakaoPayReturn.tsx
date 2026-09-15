"use client";

/**
 * 카카오페이 결제창에서 결제를 마치고 돌아오는 콜백 화면.
 * 백엔드가 ready 요청 시 approval_url 에 billingId를 심어서 보내고,
 * 카카오페이가 여기로 리다이렉트하면서 pg_token 을 붙여준다는 전제.
 * dispatch(kakaoPayApproveRequest) → saga → approve API 호출
 */
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { kakaoPayApproveRequest } from "@/features/billing/payment/slice";
import type { AppDispatch, RootState } from "@/store/store";
import { Alert, Button } from "@/components/common";

const KakaoPayReturn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, success } = useSelector((state: RootState) => state.billingPayment);

  const billingId = searchParams.get("billingId");
  const pgToken = searchParams.get("pg_token");

  // React StrictMode(개발 모드)는 마운트 시 effect를 두 번 실행하므로, ref 없이 그냥 dispatch하면
  // approve가 중복으로 나가서 카카오페이가 두 번째 요청을 "payment is already done!"으로 거절함
  const approveRequested = useRef(false);

  useEffect(() => {
    if (!billingId || !pgToken) return;
    if (approveRequested.current) return;
    approveRequested.current = true;
    dispatch(kakaoPayApproveRequest({ billingId, pgToken })); 
    // billingId/pgToken은 콜백 진입 시 한 번만 붙는 값이라 최초 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!billingId || !pgToken) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Alert variant="error">Invalid access. Payment information could not be found.</Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {loading ? <p className="text-sm text-slate-500">Processing payment approval...</p> : null}

      {error ? <Alert variant="error">{error}</Alert> : null}

      {success ? (
        <>
          <Alert variant="success">Payment completed successfully.</Alert>
          <Button variant="primary" onClick={() => router.push("/billing/payment")}>
            Back to Payment
          </Button>
        </>
      ) : null}
    </div>
  );
};

export default KakaoPayReturn;
