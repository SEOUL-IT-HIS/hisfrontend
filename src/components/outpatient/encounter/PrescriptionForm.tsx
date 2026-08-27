"use client";

import { useState } from "react";
import { Button, Select } from "@/components/common";
import { useOutpatientCommonCodeOptions } from "@/features/outpatient/commonCode/useOutpatientCommonCodeOptions";
import type { PrescriptionItemInput } from "@/features/outpatient/prescription/types";

type OrderTab = "약품" | "검사" | "수술";

type PrescriptionOrderPanelProps = {
    items: PrescriptionItemInput[];
    onChange: (items: PrescriptionItemInput[]) => void;
};

const TAB_LABELS: Record<OrderTab, string> = {
    "약품": "약제 처방",
    "검사": "검사 처방",
    "수술": "수술 처방",
};

export default function PrescriptionForm({ items, onChange }: PrescriptionOrderPanelProps) {
    const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>("약품");

    // 검사 항목 코드 옵션
    const { options: labOptions, loading: labOptionsLoading } =
        useOutpatientCommonCodeOptions("TEST_TYPE_CD");
    const [selectedLabCode, setSelectedLabCode] = useState("");

    function handleAddLabItem() {
        const option = labOptions.find((o) => o.value === selectedLabCode);
        if (!option) return;
        onChange([
            ...items,
            { prescriptionType: "검사", itemCode: option.value, itemName: option.label },
        ]);
        setSelectedLabCode("");
    }

    function handleRemoveItem(index: number) {
        onChange(items.filter((_, i) => i !== index));
    }

    const itemsByTab = (tab: OrderTab) => items.filter((item) => item.prescriptionType === tab);

    return (
        <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-3 font-semibold text-slate-700">처방 정보</div>

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
                {activeOrderTab === "검사" ? (
                    <>
                        <div className="flex gap-2 mb-3">
                            <Select
                                options={labOptions}
                                placeholder={labOptionsLoading ? "불러오는 중..." : "검사 항목 선택"}
                                value={selectedLabCode}
                                onChange={(e) => setSelectedLabCode(e.target.value)}
                                className="max-w-xs"
                            />
                            <Button variant="primary" onClick={handleAddLabItem} disabled={!selectedLabCode}>
                                추가
                            </Button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="p-2">항목코드</th>
                                    <th className="p-2">항목명</th>
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
                                                        삭제
                                                    </Button>
                                                </td>
                                            </tr>
                                        ) : null
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-slate-400">
                                            추가된 검사가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <p className="p-6 text-center text-sm text-slate-400">
                        {TAB_LABELS[activeOrderTab]}은 아직 준비 중입니다.
                    </p>
                )}
            </div>
        </div>
    );
}
