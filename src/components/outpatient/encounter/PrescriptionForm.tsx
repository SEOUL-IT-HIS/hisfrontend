"use client";

import { useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/common";
import { useOutpatientCommonCodeOptions } from "@/features/outpatient/commonCode/useOutpatientCommonCodeOptions";
import { fetchMedicationList } from "@/features/outpatient/prescription/api";
import type { MedicationDto, PrescriptionItemInput } from "@/features/outpatient/prescription/types";

// 주의: 이 값들은 화면 표시용이 아니라 실제 prescriptionType 데이터 값이다.
// 백엔드 PrescriptionServiceImpl.dispatchLabOrders()/dispatchPharmacyOrders()가
// "검사"/"약품" 문자열을 그대로 비교하므로 이 리터럴은 영어로 바꾸면 안 된다.
type OrderTab = "약품" | "검사" | "수술";

type PrescriptionOrderPanelProps = {
    items: PrescriptionItemInput[];
    onChange: (items: PrescriptionItemInput[]) => void;
    // Add 안 누른 입력 항목 유무를 알린다 (부모가 저장을 막는 데 사용)
    onPendingChange?: (pending: boolean) => void;
    // 입력 중인 항목이 있는 채로 저장을 시도했는지 (true 면 안내 문구 표시)
    showPendingWarning?: boolean;
};

// 탭에 표시되는 라벨만 영어로 번역 (키는 위 주의사항대로 한글 유지)
const TAB_LABELS: Record<OrderTab, string> = {
    "약품": "Medication", // 약제 처방
    "검사": "Lab Test",   // 검사 처방
    "수술": "Surgery",    // 수술 처방
};

// 약품 제형 (ADM DOSAGE_FORM_CD): 01 알약/캡슐, 02 수액, 03 주사
// 제형을 먼저 고르면 Instructions 예시 문구가 제형에 맞게 바뀐다
type DosageFormCd = "01" | "02" | "03";

const DOSAGE_FORMS: ReadonlyArray<{
    code: DosageFormCd;
    label: string;
    instructionsPlaceholder: string;
}> = [
    { code: "01", label: "Oral", instructionsPlaceholder: "e.g., Take 30 minutes after meals" },
    { code: "02", label: "IV Fluid", instructionsPlaceholder: "e.g., Infuse over 2 hours" },
    { code: "03", label: "Injection", instructionsPlaceholder: "e.g., Inject slowly" },
];

// 투여 횟수 (PRN = 필요 시 투여, 이 경우 사유는 Instructions 에 적는다)
const FREQUENCY_OPTIONS = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "PRN",
].map((value) => ({ value, label: value }));
const PRN_INSTRUCTIONS_PLACEHOLDER = "e.g., Take when pain occurs";

// 선택된 약 (처방에는 약품코드와 이름만 쓴다)
type PickedMedication = Pick<MedicationDto, "medicationName" | "ediCode" | "dosageFormCd">;

// 선택한 제형에 맞는 약인지 (제형을 아직 안 골랐으면 전부 통과)
// 제형 미분류(null)는 공공데이터 경구약이라 알약/캡슐(01)에만 포함한다
const matchesDosageForm = (medicationFormCd: string | null | undefined, selected: DosageFormCd | "") => {
    if (!selected) return true;
    if (selected === "01") return !medicationFormCd || medicationFormCd === "01";
    return medicationFormCd === selected;
};

const dosageFormLabel = (code?: string) =>
    DOSAGE_FORMS.find((form) => form.code === code)?.label ?? code ?? "-";

// 입력칸 위에 이름을 보여주는 라벨 (진료기록의 Chief Complaint 등과 같은 스타일)
// 검색 결과 클릭이 input 으로 새지 않게 <label> 로 감싸지 않고 div+label 로 구성
function OrderField({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string; // 필수값 누락 안내 (있으면 입력칸 아래에 빨간 글씨)
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
                {label}
                {required ? <span className="text-rose-500"> *</span> : null}
            </label>
            {children}
            {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
        </div>
    );
}

export default function PrescriptionForm({
    items,
    onChange,
    onPendingChange,
    showPendingWarning,
}: PrescriptionOrderPanelProps) {
    const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>("약품");

    // 검사 항목 코드 옵션
    const { options: labOptions, loading: labOptionsLoading } =
        useOutpatientCommonCodeOptions("TEST_TYPE_CD");
    const [selectedLabCode, setSelectedLabCode] = useState("");
    // Add 를 눌러 본 뒤에만 필수값 안내를 보여준다
    const [labAddAttempted, setLabAddAttempted] = useState(false);
    const [medAddAttempted, setMedAddAttempted] = useState(false);

    // 약품 목록 (약제서비스 연동) — 입력칸을 누르면 전체 목록, 글자를 입력하면 이름으로 좁혀진다
    const [drugSearchTerm, setDrugSearchTerm] = useState("");
    const [drugList, setDrugList] = useState<MedicationDto[]>([]);
    const [drugListLoading, setDrugListLoading] = useState(false);
    const [drugListError, setDrugListError] = useState(false);
    // 한 번에 받는 최대 건수(100)를 넘어서 일부만 보여주는 중인지
    const [drugListTruncated, setDrugListTruncated] = useState(false);
    // 약 이름 입력칸에 커서가 있는지 (목록 표시용)
    const [drugInputFocused, setDrugInputFocused] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<PickedMedication | null>(null);

    const [dosageQty, setDosageQty] = useState("");
    const [selectedDosageFormCd, setSelectedDosageFormCd] = useState<DosageFormCd | "">("");
    // 선택 전에는 알약/캡슐 기준 문구를 보여준다
    const activeDosageForm =
        DOSAGE_FORMS.find((form) => form.code === selectedDosageFormCd) ?? DOSAGE_FORMS[0];
    const [frequency, setFrequency] = useState("");
    const [durationDays, setDurationDays] = useState("");
    const [detailInfo, setDetailInfo] = useState("");

    // 입력만 하고 Add 를 안 누른 항목이 있는지 (약품/검사 어느 쪽이든)
    // (Dosage Form 선택만으로는 입력 중으로 보지 않는다)
    const hasPendingMedication = Boolean(
        drugSearchTerm.trim() || dosageQty || frequency || durationDays || detailInfo
    );
    const hasPendingOrder = hasPendingMedication || Boolean(selectedLabCode);
    useEffect(() => {
        onPendingChange?.(hasPendingOrder);
    }, [hasPendingOrder, onPendingChange]);

    // 입력칸에 커서가 있는 동안 약제서비스에서 약품 목록을 받는다.
    // 이름이 없으면 전체(이름순), 있으면 이름으로 필터. 글자 입력은 300ms 디바운스.
    // 약가코드가 없는 약은 서버에서 이미 뺀다(약제가 처방을 접수하지 않음).
    useEffect(() => {
        if (!drugInputFocused) {
            return;
        }
        // 약을 고른 직후(입력칸 = 선택한 약 이름)에는 다시 받지 않는다
        if (selectedMedication && selectedMedication.medicationName === drugSearchTerm) {
            return;
        }
        const term = drugSearchTerm.trim();
        // 응답이 늦게 와서 최신 입력의 결과를 덮어쓰지 않게 한다
        let cancelled = false;
        const timer = setTimeout(() => {
            setDrugListLoading(true);
            fetchMedicationList({ name: term, page: 0, size: 100 })
                .then((page) => {
                    if (cancelled) return;
                    setDrugList(page.content);
                    setDrugListTruncated(!page.last);
                    setDrugListError(false);
                })
                .catch(() => {
                    if (cancelled) return;
                    setDrugList([]);
                    setDrugListTruncated(false);
                    setDrugListError(true);
                })
                .finally(() => {
                    if (!cancelled) setDrugListLoading(false);
                });
        }, term ? 300 : 0);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [drugInputFocused, drugSearchTerm, selectedMedication]);

    function handleDrugSearchChange(value: string) {
        setDrugSearchTerm(value);
        setSelectedMedication(null);
    }

    function handleSelectMedication(medication: PickedMedication) {
        setSelectedMedication({
            medicationName: medication.medicationName,
            ediCode: medication.ediCode,
            dosageFormCd: medication.dosageFormCd,
        });
        setDrugSearchTerm(medication.medicationName);
        setDrugInputFocused(false);
    }

    // 제형을 바꾸면 이미 고른 약이 새 제형과 안 맞을 때 약 선택을 비운다
    function handleDosageFormSelect(code: DosageFormCd) {
        setSelectedDosageFormCd(code);
        if (selectedMedication && !matchesDosageForm(selectedMedication.dosageFormCd, code)) {
            setSelectedMedication(null);
            setDrugSearchTerm("");
        }
    }

    // 선택한 제형에 맞는 약만 보여준다 (제형을 안 골랐으면 전부)
    const visibleDrugs = drugList.filter((med) =>
        matchesDosageForm(med.dosageFormCd, selectedDosageFormCd)
    );
    // 약을 고른 직후에는 입력칸이 선택한 약 이름이라 목록을 다시 열지 않는다
    const showDrugDropdown =
        drugInputFocused && !(selectedMedication && selectedMedication.medicationName === drugSearchTerm);

    function handleAddLabItem() {
        const option = labOptions.find((o) => o.value === selectedLabCode);
        if (!option) {
            setLabAddAttempted(true);
            return;
        }
        onChange([
            ...items,
            { prescriptionType: "검사", itemCode: option.value, itemName: option.label },
        ]);
        setSelectedLabCode("");
        setLabAddAttempted(false);
    }

    // 약품 항목 추가 - 검사랑 다르게 용량/횟수/일수 등 추가 정보를 같이 받음
    function handleAddMedicationItem() {
        // 필수값(제형, 약, 용량)이 비면 추가하지 않고 안내를 보여준다
        if (!selectedMedication || !(Number(dosageQty) > 0) || !selectedDosageFormCd) {
            setMedAddAttempted(true);
            return;
        }
        setMedAddAttempted(false);

        onChange([
            ...items,
            {
                prescriptionType: "약품",
                itemCode: selectedMedication.ediCode,
                itemName: selectedMedication.medicationName,
                dosage: Number(dosageQty),
                dosageFormCd: selectedDosageFormCd,
                frequency: frequency || undefined,
                durationDays: durationDays || undefined,
                detailInfo: detailInfo || undefined,
            },
        ]);
        setSelectedMedication(null);
        setDrugSearchTerm("");
        setDosageQty("");
        setSelectedDosageFormCd("");
        setFrequency("");
        setDurationDays("");
        setDetailInfo("");
    }

    function handleRemoveItem(index: number) {
        onChange(items.filter((_, i) => i !== index));
    }

    const itemsByTab = (tab: OrderTab) => items.filter((item) => item.prescriptionType === tab);

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            {/* 처방 정보 */}
            <div className="border-b border-slate-200 p-3 font-semibold text-slate-700">Prescription Orders</div>

            <div className="flex border-b border-slate-200 gap-2 px-3">
                {(Object.keys(TAB_LABELS) as OrderTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveOrderTab(tab)}
                        className={`py-2 px-3 text-sm font-semibold border-b-2 transition ${
                            activeOrderTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {TAB_LABELS[tab]} ({itemsByTab(tab).length})
                    </button>
                ))}
            </div>

            {showPendingWarning && hasPendingOrder && (
                <p className="mx-3 mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    You have an order that has not been added. Click Add to include it, or clear the fields.
                </p>
            )}

            <div className="p-3">
                {activeOrderTab === "약품" ? (
                    <>
                        {/* 제형을 먼저 고른다 (비어 있으면 Add 시 안내) */}
                        <div className="mb-3">
                            <OrderField
                                label="Dosage Form"
                                required
                                error={medAddAttempted && !selectedDosageFormCd ? "Select a dosage form." : undefined}
                            >
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Dosage form">
                                    {DOSAGE_FORMS.map((form) => (
                                        <button
                                            key={form.code}
                                            type="button"
                                            aria-pressed={selectedDosageFormCd === form.code}
                                            onClick={() => handleDosageFormSelect(form.code)}
                                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                                selectedDosageFormCd === form.code
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            {form.label}
                                        </button>
                                    ))}
                                </div>
                            </OrderField>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-3">
                            <div className="relative">
                                <OrderField
                                    label="Drug Name"
                                    required
                                    error={medAddAttempted && !selectedMedication ? "Select a drug from the list." : undefined}
                                >
                                    <Input
                                        // 누르면 약품 목록이 열리고, 글자를 입력하면 이름으로 좁혀집니다
                                        placeholder="Click to browse, or type to search"
                                        value={drugSearchTerm}
                                        onChange={(e) => handleDrugSearchChange(e.target.value)}
                                        onFocus={() => setDrugInputFocused(true)}
                                        onBlur={() => {
                                            // 목록 클릭이 먼저 처리되도록 지연 후 닫기
                                            setTimeout(() => setDrugInputFocused(false), 150);
                                        }}
                                    />
                                </OrderField>
                                {showDrugDropdown && (
                                    <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                                        <li className="sticky top-0 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                            {selectedDosageFormCd ? `${activeDosageForm.label} drugs` : "Drugs"}
                                            {drugListTruncated ? " (showing the first 100 — type to narrow)" : ""}
                                        </li>
                                        {drugListLoading && visibleDrugs.length === 0 && (
                                            <li className="px-3 py-2 text-sm text-slate-400">Loading...</li>
                                        )}
                                        {!drugListLoading && drugListError && (
                                            <li className="px-3 py-2 text-sm text-rose-500">Failed to load drugs.</li>
                                        )}
                                        {!drugListLoading && !drugListError && visibleDrugs.length === 0 && (
                                            <li className="px-3 py-2 text-sm text-slate-400">
                                                {selectedDosageFormCd
                                                    ? `No ${activeDosageForm.label} drugs found.`
                                                    : "No results found."}
                                            </li>
                                        )}
                                        {visibleDrugs.map((med) => {
                                            // 제조사/제형명 중 값이 있는 것만 보여주고, 둘 다 없으면 줄을 숨긴다
                                            const subInfo = [med.entpName, med.formCodeName].filter(Boolean).join(" · ");
                                            return (
                                                <li
                                                    key={med.medicationId}
                                                    className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50"
                                                    onMouseDown={() => handleSelectMedication(med)}
                                                >
                                                    <div className="font-medium text-slate-800">{med.medicationName}</div>
                                                    {subInfo && <div className="text-xs text-slate-400">{subInfo}</div>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>                            <OrderField
                                label="Dose per Administration"
                                required
                                error={medAddAttempted && !(Number(dosageQty) > 0) ? "Enter a dose greater than 0." : undefined}
                            >
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    // 1회 투여량 (예: 1)
                                    placeholder="e.g., 1"
                                    value={dosageQty}
                                    onChange={(e) => setDosageQty(e.target.value)}
                                />
                            </OrderField>
                            <OrderField label="Frequency">
                                <Select
                                    options={FREQUENCY_OPTIONS}
                                    // 투여 횟수 선택 (PRN = 필요 시 투여)
                                    placeholder="Select frequency"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                />
                            </OrderField>
                            <OrderField label="Duration (Days)">
                                <Input
                                    // 예: 7일
                                    placeholder="e.g., 7"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(e.target.value)}
                                />
                            </OrderField>
                            <OrderField label="Instructions (Optional)">
                                <Input
                                    // PRN 이면 투여 시점 예시, 아니면 제형별 예시
                                    placeholder={
                                        frequency === "PRN"
                                            ? PRN_INSTRUCTIONS_PLACEHOLDER
                                            : activeDosageForm.instructionsPlaceholder
                                    }
                                    value={detailInfo}
                                    onChange={(e) => setDetailInfo(e.target.value)}
                                />
                            </OrderField>
                        </div>
                        <div className="mb-3">
                            <Button
                                variant="primary"
                                onClick={handleAddMedicationItem}
                            >
                                Add
                            </Button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="p-2">Drug</th>
                                    <th className="p-2">Dose</th>
                                    <th className="p-2">Form</th>
                                    <th className="p-2">Frequency</th>
                                    <th className="p-2">Days</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {itemsByTab("약품").length > 0 ? (
                                    items.map((item, index) =>
                                        item.prescriptionType === "약품" ? (
                                            <tr key={index}>
                                                <td className="p-2">{item.itemName}</td>
                                                <td className="p-2">{item.dosage ?? "-"}</td>
                                                <td className="p-2">{dosageFormLabel(item.dosageFormCd)}</td>
                                                <td className="p-2">{item.frequency ?? "-"}</td>
                                                <td className="p-2">{item.durationDays ?? "-"}</td>
                                                <td className="p-2">
                                                    <Button variant="ghost" onClick={() => handleRemoveItem(index)}>
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ) : null
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-slate-400">
                                            No medications added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                ) : activeOrderTab === "검사" ? (
                    <>
                        <div className="flex items-end gap-2 mb-3">
                            <div className="w-full max-w-xs">
                                <OrderField label="Lab Test" required>
                                    <Select
                                        options={labOptions}
                                        // 불러오는 중... / 검사 항목 선택
                                        placeholder={labOptionsLoading ? "Loading..." : "Select a lab test"}
                                        value={selectedLabCode}
                                        onChange={(e) => setSelectedLabCode(e.target.value)}
                                    />
                                </OrderField>
                            </div>
                            <Button variant="primary" onClick={handleAddLabItem}>
                                {/* 추가 */}
                                Add
                            </Button>
                        </div>
                        {labAddAttempted && !selectedLabCode && (
                            <p className="-mt-2 mb-3 text-xs text-rose-500">Select a lab test.</p>
                        )}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    {/* 항목코드 / 항목명 */}
                                    <th className="p-2">Code</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {itemsByTab("검사").length > 0 ? (
                                    items.map((item, index) =>
                                        item.prescriptionType === "검사" ? (
                                            <tr key={index}>
                                                <td className="p-2">{item.itemCode}</td>
                                                <td className="p-2">{item.itemName}</td>
                                                <td className="p-2">
                                                    <Button variant="ghost" onClick={() => handleRemoveItem(index)}>
                                                        {/* 삭제 */}
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ) : null
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-slate-400">
                                            {/* 추가된 검사가 없습니다. */}
                                            No lab tests added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <p className="p-6 text-center text-sm text-slate-400">
                        {TAB_LABELS[activeOrderTab]} ordering is coming soon.
                    </p>
                )}
            </div>
        </div>
    );
}
