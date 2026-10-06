export type ReceptionListItem = {
    receptionId: string;
    /**
     * 접수서비스(RCP)는 patientId만 보내고 patientName은 안 보낸다(설계상 그렇게 하기로 함).
     * 이름은 patientId로 환자서비스(patient-service)에 배치조회해서 채우기로 돼있는데,
     * 그 연동이 아직 안 붙어서 지금은 null로 온다 — 버그 아니라 예상된 중간 상태.
     */
    patientName: string | null;
    receivedAt: string | null;
    /** KTAS 아직 안 매겨진 접수 건은 null(정상 — "미분류"로 표시). */
    ktasLevelCode: string | null;
    /** IN_CARE(진료 중) | DONE(퇴실 처리 완료) | CANCELLED(접수에서 취소) */
    careStatusCode?: string;
    bedNo: string | null;
    zoneCode: string | null;
    /** 접수 시 RCP가 남긴 메모. 없으면 null. */
    memo: string | null;
    /** 접수 시 입력된 주호소 원문(구조화 전). 없으면 null. */
    chiefComplaintRaw: string | null;
};

/** "취소 아님"으로 확인한 결과를 다시 묻기까지의 시간(그 사이 접수에서 취소될 수 있다) */
export const RECEPTION_CANCEL_RECHECK_MS = 60_000;

/** 환자 목록을 자동으로 다시 불러오는 간격(접수에서 들어온 환자를 새로고침 없이 보이게 한다) */
export const RECEPTION_LIST_POLL_INTERVAL_MS = 10_000;

export type ReceptionListState = {
    items: ReceptionListItem[];
    loading: boolean;
    error: string;
    /** 마지막으로 요청한 상태 필터(IN_CARE · DONE · CANCELLED, undefined = 전체) */
    statusFilter?: string;
    /** 선택해 둔 환자가 목록에서 사라졌을 때 접수 취소 여부를 물은 결과(checking → cancelled | active) */
    cancelCheck: Record<string, { state: "checking" | "cancelled" | "active"; at: number }>;
};