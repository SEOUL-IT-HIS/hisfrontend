// 처방 구분 표기: 외래 OP / 병동 IP / 응급 ER
// 서비스마다 다른 값(OP, 외래, ADMISSION, ER 등)이 와서 하나로 통일한다.
// 모르는 값은 원본, 값이 없으면 "-"
const SERVICE_TYPE_LABEL: Record<string, string> = {
    OP: "OP",
    OUTPATIENT: "OP",
    "외래": "OP",
    IP: "IP",
    ADMISSION: "IP",
    INPATIENT: "IP",
    "입원": "IP",
    ER: "ER",
    EMERGENCY: "ER",
    "응급": "ER",
};

export const getServiceTypeLabel = (serviceType?: string | null) =>
    serviceType ? (SERVICE_TYPE_LABEL[serviceType.toUpperCase()] ?? serviceType) : "-";
