"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerMedicationReturnRequest,
  registerReturnedDisposalRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, Input } from "@/components/common";
import type { DispensingLot } from "@/features/pharmacy/types";
import { useActor } from "@/features/pharmacy/useActor";

type ReturnCellProps = {
  /** 반납은 조제에 사용된 로트 한 줄 단위로 처리한다 */
  lot: DispensingLot;
  prescriptionLinkId: string;
};

/**
 * 반납(HL2-22) + 반납약품폐기(HL2-23)를 한 로트 줄 안에서 이어서 처리한다.
 * 한 처방항목이 여러 로트에서 조제됐으면(재고가 한 로트로 모자란 경우) 로트마다 이 셀이 하나씩 나온다.
 *
 * 반납이 성공하면 생성된 medicationReturnItemId를 알아야 바로 이어서 반납약품폐기를 걸 수 있는데,
 * 서버 응답은 saga를 거쳐 pharmacy.lastReturnItemId에 잠깐 보관된다. 이 컴포넌트가 막 요청을
 * 보낸 뒤(awaitingReturn)에만 그 값을 자기 것으로 받아 쓴다 — 그래야 다른 행이 반납을 처리할 때
 * 값이 섞여 들어오지 않는다.
 */
export default function ReturnCell({ lot, prescriptionLinkId }: ReturnCellProps) {
  const dispatch = useDispatch();
  const { actorId } = useActor();
  const loading = useSelector((state: RootState) => state.pharmacy.returnLoading);
  const error = useSelector((state: RootState) => state.pharmacy.returnError);
  const lastReturnItemId = useSelector(
    (state: RootState) => state.pharmacy.lastReturnItemId
  );

  // 이미 반납된 수량을 뺀 남은 반납 가능 수량 — 조제된 수량을 넘겨 반납할 수 없다(서버도 막음, PHM017)
  const returnableQty = lot.dispensedQty - lot.returnedQty;

  const [mode, setMode] = useState<"idle" | "return" | "dispose">("idle");
  const [returnQty, setReturnQty] = useState(String(returnableQty));
  const [returnReason, setReturnReason] = useState("");
  const [myReturnItemId, setMyReturnItemId] = useState<string | null>(null);
  const [disposalQty, setDisposalQty] = useState("");
  const [disposalReason, setDisposalReason] = useState("");
  const [awaitingReturn, setAwaitingReturn] = useState(false);

  // "반납 요청을 보낸 뒤, saga 처리가 끝나는 순간"을 렌더 중에 감지한다(useEffect 대신
  // React가 권장하는 "렌더 중 상태 조정" 패턴 — loading이 바뀐 걸 직접 비교해서 한 번만 반응).
  const [prevLoading, setPrevLoading] = useState(loading);
  if (prevLoading !== loading) {
    setPrevLoading(loading);
    if (awaitingReturn && !loading) {
      if (!error && lastReturnItemId) {
        setMyReturnItemId(lastReturnItemId);
        setDisposalQty(returnQty);
        setMode("dispose");
      }
      setAwaitingReturn(false);
    }
  }

  const handleSubmitReturn = () => {
    if (!actorId || !returnQty || !returnReason.trim()) return;
    dispatch(
      registerMedicationReturnRequest({
        dispensingItemId: lot.dispensingItemId,
        returnQty: Number(returnQty),
        reason: returnReason.trim(),
        actorId,
        prescriptionLinkId,
      })
    );
    setAwaitingReturn(true);
  };

  const handleSubmitDisposal = () => {
    if (!actorId || !myReturnItemId || !disposalQty || !disposalReason.trim()) return;
    dispatch(
      registerReturnedDisposalRequest({
        medicationReturnItemId: myReturnItemId,
        disposalQty: Number(disposalQty),
        reason: disposalReason.trim(),
        actorId,
        prescriptionLinkId,
      })
    );
    setMode("idle");
    setMyReturnItemId(null);
  };

  const lotLabel = (
    <p className="text-xs text-slate-500">
      {lot.lotNo} · dispensed {lot.dispensedQty}
      {lot.returnedQty > 0 && <> · returned {lot.returnedQty}</>}
    </p>
  );

  if (mode === "idle") {
    return (
      <div className="flex flex-col gap-1">
        {lotLabel}
        {returnableQty > 0 ? (
          <Button variant="secondary" onClick={() => setMode("return")} className="h-8 w-fit px-2 text-xs">
            Return
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Fully returned</span>
        )}
      </div>
    );
  }

  if (mode === "return") {
    return (
      <div className="flex flex-col gap-1">
        {lotLabel}
        <Input
          type="number"
          placeholder={`Return Qty (max ${returnableQty})`}
          value={returnQty}
          max={returnableQty}
          onChange={(e) => setReturnQty(e.target.value)}
          className="h-8 w-32"
        />
        <Input
          type="text"
          placeholder="Return Reason"
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          className="h-8 w-44"
        />
        <div className="flex gap-1">
          <Button
            onClick={handleSubmitReturn}
            disabled={loading || !actorId || !returnQty || !returnReason.trim()}
            className="h-8 px-2 text-xs"
          >
            Submit
          </Button>
          <Button variant="ghost" onClick={() => setMode("idle")} className="h-8 px-2 text-xs">
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-emerald-600">Returned. Dispose of any unusable part below.</p>
      <Input
        type="number"
        placeholder="Disposal Qty"
        value={disposalQty}
        onChange={(e) => setDisposalQty(e.target.value)}
        className="h-8 w-32"
      />
      <Input
        type="text"
        placeholder="Disposal Reason"
        value={disposalReason}
        onChange={(e) => setDisposalReason(e.target.value)}
        className="h-8 w-44"
      />
      <div className="flex gap-1">
        <Button
          variant="danger"
          onClick={handleSubmitDisposal}
          disabled={loading || !actorId || !disposalQty || !disposalReason.trim()}
          className="h-8 px-2 text-xs"
        >
          Dispose
        </Button>
        <Button variant="ghost" onClick={() => setMode("idle")} className="h-8 px-2 text-xs">
          Done
        </Button>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
