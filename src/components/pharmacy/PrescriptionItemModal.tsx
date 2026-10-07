"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMedicationListRequest,
  fetchMedicationStockRequest,
} from "@/features/pharmacy/slice";
import { Button, Modal } from "@/components/common";
import type { RootState } from "@/store/store";
import type { PrescriptionItem } from "@/features/pharmacy/types";
import { dosageFormLabel } from "@/features/pharmacy/labels";

type PrescriptionItemModalProps = {
  item: PrescriptionItem | null;
  /** RECEIVED / DISPENSED / REJECTED — 조제 전/후에 보여줄 내용이 다르다 */
  prescriptionStatus: string;
  onClose: () => void;
};

type Field = { label: string; value: string };

function FieldGrid({ fields }: { fields: Field[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="text-xs text-slate-400">{field.label}</dt>
          <dd className="break-words text-slate-700">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 처방 항목 상세 — 처방 내용(용량/횟수/일수/비고), 약품 마스터 정보, 로트별 현재 재고, 조제된 로트 내역을
 * 한 곳에서 본다. 처방전 상세의 표에는 핵심만 두고, 확인할 게 더 있을 때 행을 눌러 이 모달로 본다.
 */
export default function PrescriptionItemModal({
  item,
  prescriptionStatus,
  onClose,
}: PrescriptionItemModalProps) {
  const dispatch = useDispatch();
  const medications = useSelector((state: RootState) => state.pharmacy.medicationList);
  const stockList = useSelector((state: RootState) => state.pharmacy.medicationStockList);
  const stockLoading = useSelector((state: RootState) => state.pharmacy.medicationStockLoading);

  const medicationId = item?.medicationId;
  useEffect(() => {
    if (!medicationId) return;
    if (medications.length === 0) dispatch(fetchMedicationListRequest());
    dispatch(fetchMedicationStockRequest(medicationId));
    // medications.length는 의존성에 넣지 않는다 — 목록이 채워질 때마다 재고를 다시 부르지 않게 하려는 것
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, medicationId]);

  const medication = medications.find((m) => String(m.medicationId) === medicationId);
  const totalStock = stockList.reduce((sum, row) => sum + row.currentQty, 0);

  return (
    <Modal
      open={item !== null}
      title={item?.medicationName ?? "Prescription Item"}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {item && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Prescription</h3>
            <FieldGrid
              fields={[
                { label: "Dosage per time", value: `${item.dosageQty} (${dosageFormLabel(item.dosageFormCd)})` },
                { label: "Frequency", value: item.frequency || "-" },
                { label: "Duration (days)", value: item.durationDays || "-" },
                { label: "Expected total qty", value: String(item.expectedQty) },
                { label: "Note", value: item.detailInfo || "-" },
              ]}
            />
            {item.qtyAmbiguous && (
              <p className="mt-2 text-xs text-amber-600">
                The frequency or duration is free text and could not be read as a single number, so that part was
                counted as 1. Check the expected quantity against the prescription before dispensing.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Medication</h3>
            <FieldGrid
              fields={[
                { label: "Medication ID", value: item.medicationId },
                { label: "EDI Code", value: item.ediCode || "-" },
                { label: "Company", value: medication?.entpName || "-" },
                { label: "Rx/OTC", value: medication?.etcOtcName || "-" },
                { label: "Class", value: medication?.className || medication?.classNo || "-" },
                { label: "Form (detail)", value: medication?.formCodeName || "-" },
                { label: "Appearance", value: medication?.chart || "-" },
                { label: "Standard Code", value: medication?.stdCd || "-" },
              ]}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Current stock <span className="font-normal text-slate-400">(total {totalStock})</span>
            </h3>
            {stockLoading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : stockList.length === 0 ? (
              <p className="text-sm text-rose-500">No stock for this medication.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Lot No.</th>
                    <th className="py-1 pr-3 font-medium">Expiration</th>
                    <th className="py-1 pr-3 font-medium">Location</th>
                    <th className="py-1 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.map((row) => (
                    <tr key={row.medicationStockId} className="border-t border-slate-100 text-slate-700">
                      <td className="py-1.5 pr-3">{row.lotNo}</td>
                      <td className="py-1.5 pr-3">{row.expirationDt ?? "-"}</td>
                      <td className="py-1.5 pr-3">{row.storageLocationId}</td>
                      <td className="py-1.5">{row.currentQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {prescriptionStatus === "RECEIVED" && (
              <p className="mt-2 text-xs text-slate-400">
                Stock is used from the earliest-expiring lot first; if one lot is not enough, the next lot is used too.
              </p>
            )}
          </section>

          {item.dispensingLots.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Dispensed from <span className="font-normal text-slate-400">(total {item.dispensedQty})</span>
              </h3>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Lot No.</th>
                    <th className="py-1 pr-3 font-medium">Expiration</th>
                    <th className="py-1 pr-3 font-medium">Dispensed</th>
                    <th className="py-1 font-medium">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {item.dispensingLots.map((lot) => (
                    <tr key={lot.dispensingItemId} className="border-t border-slate-100 text-slate-700">
                      <td className="py-1.5 pr-3">{lot.lotNo}</td>
                      <td className="py-1.5 pr-3">{lot.expirationDt ?? "-"}</td>
                      <td className="py-1.5 pr-3">{lot.dispensedQty}</td>
                      <td className="py-1.5">{lot.returnedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
