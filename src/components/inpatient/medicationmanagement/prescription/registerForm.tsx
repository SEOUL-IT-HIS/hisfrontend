"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  clearPrescriptionState,
  createPrescriptionRequest,
  selectPrescriptionCreateStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";
import {
  PRESCRIPTION_TYPE_LAB,
  PRESCRIPTION_TYPE_MEDICATION,
  type PrescriptionItemCreateDTO,
} from "@/features/inpatient/medicationmanagement/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import SectionCard from "@/components/inpatient/common/SectionCard";
import { Alert, Button } from "@/components/common";


// 외래 처방코어가 알려준 예시값을 기본값으로 둠
// - serviceType(ADMISSION), orderMethod(EMR): 입원 화면에서 보내는 처방은 항상 같은 값이라 입력칸 없이 고정으로 보냄
//   (외래 화면도 같은 방식 — serviceType "OP", orderMethod "EMR" 고정. serviceType 은 공통코드에도 해당 그룹이 없음)
// - priorityCode / timingCode: 공통코드 숫자 코드 (외래·응급과 같은 체계) — 드롭다운으로 고름
const DEFAULT_HEADER = {
  serviceType: "ADMISSION",
  orderMethod: "EMR",
  priorityCode: "03", // 공통코드 ORDER_PRIORITY_CD: 01 STAT / 02 Urgent / 03 Routine
  timingCode: "01", // 공통코드 ORDER_TIMING_CD: 01 Scheduled / 02 As Needed (PRN) / 03 Once (외래 요청으로 숫자 코드 사용)
};

type ItemFormRow = {
  prescriptionType: string;
  itemCode: string;
  itemName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  detailInfo: string;
  dosageFormCd: string;
};

const EMPTY_ITEM: ItemFormRow = {
  prescriptionType: PRESCRIPTION_TYPE_LAB,
  itemCode: "",
  itemName: "",
  dosage: "",
  frequency: "",
  durationDays: "",
  detailInfo: "",
  dosageFormCd: "",
};

type PrescriptionRegisterFormProps = {
  admissionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const PrescriptionRegisterForm = ({ admissionId, onSuccess, onCancel }: PrescriptionRegisterFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector(selectPrescriptionCreateStatus);

  const [form, setForm] = useState({ ...DEFAULT_HEADER });
  const [items, setItems] = useState<ItemFormRow[]>([{ ...EMPTY_ITEM }]);

  // 외래 처방 화면과 같은 공통코드 사용 — 검사서비스가 알아듣는 코드 체계 (외래·검사서비스 확인 완료)
  // 검사 항목: TEST_TYPE_CD 값(예: CBC → "02")이 itemCode, 이름이 itemName
  // 약품 제형: DOSAGE_FORM_CD (TAB / IV / INJ)
  const { options: labTestOptions, loading: labTestLoading } = useCommonCodeOptions("TEST_TYPE_CD");
  const { options: dosageFormOptions } = useCommonCodeOptions("DOSAGE_FORM_CD");
  // 투약 시점: ORDER_TIMING_CD (01 / 02 / 03) — 공통코드를 못 불러오면 등록된 값과 같은 기본 목록 사용
  const { options: loadedTimingOptions } = useCommonCodeOptions("ORDER_TIMING_CD");
  const timingOptions = loadedTimingOptions.length > 0
    ? loadedTimingOptions
    : [
        { value: "01", label: "Scheduled" },
        { value: "02", label: "As Needed (PRN)" },
        { value: "03", label: "Once" },
      ];
  // 처방 우선순위: ORDER_PRIORITY_CD (01 / 02 / 03) — 공통코드를 못 불러오면 등록된 값과 같은 기본 목록 사용
  const { options: loadedPriorityOptions } = useCommonCodeOptions("ORDER_PRIORITY_CD");
  const priorityOptions = loadedPriorityOptions.length > 0
    ? loadedPriorityOptions
    : [
        { value: "01", label: "STAT" },
        { value: "02", label: "Urgent" },
        { value: "03", label: "Routine" },
      ];

  // 폼을 열 때 이전 요청의 에러 메시지를 지움 (다른 환자 폼에 이전 에러가 남지 않도록)
  useEffect(() => {
    dispatch(clearPrescriptionState());
  }, [dispatch]);

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      // 종류(검사↔약품)를 바꾸면 코드 체계가 달라지므로 항목 값은 비우고 새로 고르게 함
      if (name === "prescriptionType") return { ...EMPTY_ITEM, prescriptionType: value };
      return { ...item, [name]: value };
    }));
  };

  // 검사 항목 선택 — 공통코드 값은 itemCode, 이름은 itemName으로 같이 채움
  const onLabTestChange = (index: number, code: string) => {
    const option = labTestOptions.find((o) => o.value === code);
    setItems((prev) => prev.map((item, i) => (
      i === index ? { ...item, itemCode: code, itemName: option?.label ?? "" } : item
    )));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 사용자가 입력한 값만 보냄 — 검사 항목은 용량/제형이 없으므로 약품일 때만 포함
    const requestItems: PrescriptionItemCreateDTO[] = items.map((item) => {
      const isMedication = item.prescriptionType === PRESCRIPTION_TYPE_MEDICATION;
      return {
        prescriptionType: item.prescriptionType,
        itemCode: item.itemCode,
        itemName: item.itemName,
        detailInfo: item.detailInfo || undefined,
        // 횟수·일수는 약품에만 보냄 (검사로 바꾸기 전에 입력해 둔 값이 남아 있어도 검사에는 실리지 않게)
        ...(isMedication && {
          frequency: item.frequency || undefined,
          durationDays: item.durationDays || undefined,
          dosage: item.dosage ? Number(item.dosage) : undefined,
          dosageFormCd: item.dosageFormCd || undefined,
        }),
      };
    });

    dispatch(
      createPrescriptionRequest({
        admissionId,
        request: { ...form, items: requestItems },
      })
    );
  };

  // 요청 성공 처리 후 바로 success를 false로 되돌림
  // → 안 되돌리면 success=true가 남아서, 다음에 폼을 다시 열자마자 이 effect가 실행돼 폼이 바로 닫힘
  // 입력값 초기화는 하지 않음 — 성공하면 부모(PrescriptionRequestHome)가 폼을 닫고, 다시 열 때 새로 마운트됨
  useEffect(() => {
    if (!success) return;
    dispatch(clearPrescriptionState());
    onSuccess?.();
  }, [success]);

  return (
    <SectionCard
      title="New Prescription Request"
      description="Registered in the outpatient prescription core, then sent to the lab / pharmacy automatically."
      actions={
        onCancel && (
          <Button variant="secondary" className="!h-8 !px-3" onClick={onCancel}>
            Cancel
          </Button>
        )
      }
    >
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Service Type(ADMISSION)과 Order Method(EMR)는 입원 처방이면 항상 같은 값이라 입력칸 없이 고정으로 보냄 */}
          <div>
            <label htmlFor="priorityCode" className={LABEL}>Priority Code</label>
            <select id="priorityCode" name="priorityCode" value={form.priorityCode} onChange={onFormChange} required className={FIELD}>
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="timingCode" className={LABEL}>Timing Code</label>
            <select id="timingCode" name="timingCode" value={form.timingCode} onChange={onFormChange} required className={FIELD}>
              {timingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Items</p>
            <Button variant="secondary" className="!h-8 !px-3"
              onClick={addItem}
            >
              + Add Item
            </Button>
          </div>

          {items.map((item, index) => {
            const isMedication = item.prescriptionType === PRESCRIPTION_TYPE_MEDICATION;
            return (
              <div key={index} className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item {index + 1}</p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Prescription Type</label>
                    {/* 값은 외래 규칙대로 한글("검사"/"약품")로 보냄 — 다른 값이면 외래 전송에서 걸러짐 */}
                    <select name="prescriptionType" value={item.prescriptionType} onChange={(e) => onItemChange(index, e)} required className={FIELD}>
                      <option value={PRESCRIPTION_TYPE_LAB}>Lab Test (검사)</option>
                      <option value={PRESCRIPTION_TYPE_MEDICATION}>Medication (약품)</option>
                    </select>
                  </div>
                  {isMedication ? (
                    <>
                      {/* 약품은 외래 약품 검색 API(약제서비스 경유) 사용 여부가 미확정이라 직접 입력 */}
                      <div>
                        <label className={LABEL}>Item Code</label>
                        <input type="text" name="itemCode" value={item.itemCode} onChange={(e) => onItemChange(index, e)} required
                          placeholder="e.g. 195700020" className={FIELD} />
                      </div>
                      <div className="col-span-2">
                        <label className={LABEL}>Item Name</label>
                        <input type="text" name="itemName" value={item.itemName} onChange={(e) => onItemChange(index, e)} required
                          placeholder="e.g. 타이레놀정500mg" className={FIELD} />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className={LABEL}>Lab Test</label>
                      <select value={item.itemCode} onChange={(e) => onLabTestChange(index, e.target.value)} required className={FIELD}>
                        <option value="">{labTestLoading ? "Loading..." : "Select"}</option>
                        {labTestOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* 횟수·일수·용량·제형은 약품에만 해당 — 검사는 횟수/일수를 받지 않음 (외래·응급 처방도 약품에만 받고, 검사서비스도 쓰지 않음) */}
                  {isMedication && (
                    <>
                      <div>
                        <label className={LABEL}>Frequency</label>
                        <input type="text" name="frequency" value={item.frequency} onChange={(e) => onItemChange(index, e)}
                          placeholder="e.g. TID" className={FIELD} />
                      </div>
                      <div>
                        <label className={LABEL}>Duration Days</label>
                        <input type="text" name="durationDays" value={item.durationDays} onChange={(e) => onItemChange(index, e)}
                          placeholder="e.g. 3" className={FIELD} />
                      </div>
                      <div>
                        <label className={LABEL}>Dosage</label>
                        <input type="number" step="0.1" name="dosage" value={item.dosage} onChange={(e) => onItemChange(index, e)}
                          placeholder="e.g. 1.0" className={FIELD} />
                      </div>
                      <div>
                        <label className={LABEL}>Dosage Form Code</label>
                        <select name="dosageFormCd" value={item.dosageFormCd} onChange={(e) => onItemChange(index, e)} className={FIELD}>
                          <option value="">Select</option>
                          {dosageFormOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} ({opt.value})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <label className={LABEL}>Detail Info</label>
                    <input type="text" name="detailInfo" value={item.detailInfo} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Request"}
        </Button>
      </form>
    </SectionCard>
  );
};

export default PrescriptionRegisterForm;
