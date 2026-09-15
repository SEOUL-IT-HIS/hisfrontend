import type { SearchPatientResult } from "@/features/billing/history/types";

type BillingHistorySearchListProps = {
    patient: SearchPatientResult;
    selected: boolean;
    onSelect: (patientId: string) => void;
};

export default function BillingHistorySearchList({
    patient,
    selected,
    onSelect,
}: BillingHistorySearchListProps) {
    return (
        <div
            onClick={() => onSelect(patient.patientId)}
            style={{
                cursor: "pointer",
                padding: "8px",
                border: "1px solid #ddd",
                backgroundColor: selected ? "#eef6ff" : "#fff",
            }}
        >
            <span>{patient.patientName}</span>
            <span> / {patient.birthDate}</span>
            <span> / {patient.phoneNo}</span>
            <span> / {patient.address}</span>
        </div>
    );
}
