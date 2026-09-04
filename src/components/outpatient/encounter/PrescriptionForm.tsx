"use client";

import { useState } from "react";
import { Button, Input, Select } from "@/components/common";
import { useOutpatientCommonCodeOptions } from "@/features/outpatient/commonCode/useOutpatientCommonCodeOptions";
import type { PrescriptionItemInput } from "@/features/outpatient/prescription/types";

// 주의: 이 값들은 화면 표시용이 아니라 실제 prescriptionType 데이터 값이다.
// 백엔드 PrescriptionServiceImpl.dispatchLabOrders()/dispatchPharmacyOrders()가
// "검사"/"약품" 문자열을 그대로 비교해서 걸러내므로, 이 리터럴은 절대 영어로 바꾸면 안 된다.
type OrderTab = "약품" | "검사" | "수술";

type PrescriptionOrderPanelProps = {
    items: PrescriptionItemInput[];
    onChange: (items: PrescriptionItemInput[]) => void;
};

// 탭에 표시되는 라벨만 영어로 번역 (키는 위 주의사항대로 한글 유지)
const TAB_LABELS: Record<OrderTab, string> = {
    "약품": "Medication", // 약제 처방
    "검사": "Lab Test",   // 검사 처방
    "수술": "Surgery",    // 수술 처방
};

export default function PrescriptionForm({ items, onChange }: PrescriptionOrderPanelProps) {
    const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>("약품");

    // 검사 항목 코드 옵션
    const { options: labOptions, loading: labOptionsLoading } =
        useOutpatientCommonCodeOptions("TEST_TYPE_CD");
    const [selectedLabCode, setSelectedLabCode] = useState("");

    // 약품 항목 코드 / 제형 코드 옵션
    // 참고: ADM 공통코드 그룹명이 실제로 다르면(DRUG_CD/DOSAGE_FORM_CD) 이 groupCode 값만 바꾸면 됨
    const { options: drugOptions, loading: drugOptionsLoading } =
        useOutpatientCommonCodeOptions("DRUG_CD");
    const { options: dosageFormOptions, loading: dosageFormOptionsLoading } =
        useOutpatientCommonCodeOptions("DOSAGE_FORM_CD");

    const [selectedDrugCode, setSelectedDrugCode] = useState("");
    const [dosageQty, setDosageQty] = useState("");
    const [selectedDosageFormCd, setSelectedDosageFormCd] = useState("");
    const [frequency, setFrequency] = useState("");
    const [durationDays, setDurationDays] = useState("");
    const [detailInfo, setDetailInfo] = useState("");

    function handleAddLabItem() {
        const option = labOptions.find((o) => o.value === selectedLabCode);
        if (!option) return;
        onChange([
            ...items,
            { prescriptionType: "검사", itemCode: option.value, itemName: option.label },
        ]);
        setSelectedLabCode("");
    }

    // 약품 항목 추가 - 검사랑 다르게 용량/횟수/일수 등 추가 정보를 같이 받음
    function handleAddMedicationItem() {
        const option = drugOptions.find((o) => o.value === selectedDrugCode);
        if (!option || !dosageQty) return;

        onChange([
            ...items,
            {
                prescriptionType: "약품",
                itemCode: option.value,
                itemName: option.label,
                dosage: Number(dosageQty),
                dosageFormCd: selectedDosageFormCd || undefined,
                frequency: frequency || undefined,
                durationDays: durationDays || undefined,
                detailInfo: detailInfo || undefined,
            },
        ]);
        setSelectedDrugCode("");
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

            <div className="p-3">
                {activeOrderTab === "약품" ? (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-3">
                            <Select
                                options={drugOptions}
                                placeholder={drugOptionsLoading ? "Loading..." : "Select a drug"}
                                value={selectedDrugCode}
                                onChange={(e) => setSelectedDrugCode(e.target.value)}
                            />
                            <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="Dose per administration"
                                value={dosageQty}
                                onChange={(e) => setDosageQty(e.target.value)}
                            />
                            <Select
                                options={dosageFormOptions}
                                placeholder={dosageFormOptionsLoading ? "Loading..." : "Dosage form"}
                                value={selectedDosageFormCd}
                                onChange={(e) => setSelectedDosageFormCd(e.target.value)}
                            />
                            <Input
                                placeholder="Frequency (e.g., 3x/day)"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                            />
                            <Input
                                placeholder="Duration (days)"
                                value={durationDays}
                                onChange={(e) => setDurationDays(e.target.value)}
                            />
                            <Input
                                placeholder="Instructions (optional)"
                                value={detailInfo}
                                onChange={(e) => setDetailInfo(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <Button
                                variant="primary"
                                onClick={handleAddMedicationItem}
                                disabled={!selectedDrugCode || !dosageQty}
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
                                                <td className="p-2">{item.dosageFormCd ?? "-"}</td>
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
                        <div className="flex gap-2 mb-3">
                            <Select
                                options={labOptions}
                                // 불러오는 중... / 검사 항목 선택
                                placeholder={labOptionsLoading ? "Loading..." : "Select a lab test"}
                                value={selectedLabCode}
                                onChange={(e) => setSelectedLabCode(e.target.value)}
                                className="max-w-xs"
                            />
                            <Button variant="primary" onClick={handleAddLabItem} disabled={!selectedLabCode}>
                                {/* 추가 */}
                                Add
                            </Button>
                        </div>
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
