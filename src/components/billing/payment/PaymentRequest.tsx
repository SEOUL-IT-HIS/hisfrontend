"use client";
//** 결제 요청 컴포넌트 **/
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { kakaoPayReadyRequest, paymentRequest, resetPayment } from "@/features/billing/payment/slice";
import type { PaymentMethodCode } from "@/features/billing/payment/types";
import type { AppDispatch, RootState } from "@/store/store";
import { Alert, Button, Modal } from "@/components/common";

// 부모(BillingDetailSearchDetail)가 이 모달을 띄울 때 넘겨주는 값들.
// open/onClose는 모달 자체를 껐다 켰다 하는 제어권을 부모가 갖고 있다는 뜻(제어 컴포넌트 패턴).
interface PaymentRequestProps {
  billingId: string;      // 결제할 수납 건 id - 서버에 보낼 때 이것만 있으면 됨(금액은 서버가 DB에서 다시 계산)
  paymentAmount: number;  // 화면에 "얼마 결제하나" 보여주기 위한 표시 전용 값. API 요청에는 안 씀
  open: boolean;          // true면 모달이 열려있음
  onClose: () => void;    // 닫기 버튼/배경 클릭 등으로 모달을 닫을 때 부모에게 알려주는 콜백
}

// 라디오 버튼으로 고를 결제수단 목록. code는 서버로 보내는 값, label은 화면에 보이는 텍스트
const PAYMENT_METHODS: { code: PaymentMethodCode; label: string }[] = [
  { code: "CASH", label: "Cash" },
  { code: "CARD", label: "Card" },
  { code: "KAKAO_PAY", label: "KakaoPay" },
];

const PaymentRequest = ({ billingId, paymentAmount, open, onClose }: PaymentRequestProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector((state: RootState) => state.billingPayment);

  // 라디오 버튼으로 선택한 결제수단. 아직 아무것도 안 골랐을 수 있어서 ""도 허용
  const [paymentMethodCode, setPaymentMethodCode] = useState<PaymentMethodCode | "">("");

  // "Pay" 버튼을 눌렀을 때 실행됨
  const handlePayment = () => {
    // 아무 결제수단도 안 고르고 눌렀으면 여기서 막음
    if (!paymentMethodCode) {
      alert("Please select a payment method.");
      return;
    }

    // 카카오페이는 CASH/CARD와 흐름이 다름(바로 결제 확정이 아니라 카카오페이 결제창으로 이동해야 함).
    // 그래서 다른 액션(kakaoPayReadyRequest)을 dispatch하고 여기서 함수를 끝냄.
    // -> saga가 이 액션을 받아서 준비(ready) API를 호출하고, 성공하면 카카오페이 결제창으로 리다이렉트시킴.
    //    승인(approve)까지의 나머지 흐름은 카카오페이가 돌려보내주는 콜백 페이지(KakaoPayReturn)에서 처리됨.
    if (paymentMethodCode === "KAKAO_PAY") {
      dispatch(kakaoPayReadyRequest({ billingId }));
      return;
    }

    dispatch(paymentRequest({ billingId, paymentMethodCode }));
  };

  // 모달을 닫을 때(취소 버튼, 성공 후 닫기 버튼 등) 실행됨
  const handleClose = () => {
    setPaymentMethodCode("");   // 다음에 다시 열었을 때 라디오 선택이 남아있지 않도록 초기화
    dispatch(resetPayment());   // redux의 loading/error/success도 초기값으로 되돌림(안 하면 다음에 열자마자 "결제 완료" 문구가 그대로 보임)
    onClose();                  // 실제로 모달을 닫는 건 부모 컴포넌트 책임이라 콜백으로 알려줌
  };

  return (
    // closeDisabled={loading}: API 응답 기다리는 중에는 닫기 버튼을 눌러도 안 닫히게 막음(결제 중간에 모달이 닫히는 것 방지)
    <Modal open={open} title="Payment" onClose={handleClose} closeDisabled={loading}>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">Payment Amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            ₩{paymentAmount.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {PAYMENT_METHODS.map(({ code, label }) => (
            <label
              key={code}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                paymentMethodCode === code
                  ? "border-sky-400 bg-sky-50/80 text-sky-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"        // 같은 name끼리는 하나만 선택 가능(라디오 버튼 그룹 묶는 기준)
                value={code}
                checked={paymentMethodCode === code}  // 실제 체크 여부는 useState 값과 비교해서 결정(제어 컴포넌트)
                onChange={() => setPaymentMethodCode(code)}  // 클릭하면 useState 값만 바꿈 - 아직 서버 호출 없음
                className="h-4 w-4 accent-sky-600"
              />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>

        {/* error/success는 redux state 값 - saga가 API 호출 결과에 따라 채워줌.
            error가 있으면 에러 문구, success가 true면 성공 문구. 둘 다 없으면(초기 상태) 아무것도 안 보임 */}
        {error ? <Alert variant="error">{error}</Alert> : null}
        {success ? <Alert variant="success">Payment completed successfully.</Alert> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          {/* success 여부에 따라 버튼 텍스트만 바뀜(Cancel <-> Close), 동작(handleClose)은 동일 */}
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {success ? "Close" : "Cancel"}
          </Button>
          {/* 이미 결제 성공했으면 Pay 버튼 자체를 안 보여줌(다시 누를 이유가 없으니까) */}
          {!success ? (
            <Button variant="primary" onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : "Pay"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentRequest;
