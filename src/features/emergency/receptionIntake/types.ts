/**
 * 응급접수 정보 수신 — UC-CARE-01 보조 (Jira UD2-14)
 * 백엔드 ReceptionIntakeDto 미러링.
 *
 * 원래는 RCP(원무접수) 시스템이 접수 발생 시 자동 호출하도록 설계된 API다.
 * RCP 연동 전이라, 이 화면에서는 그 호출을 수동으로 대신하는 폼만 제공한다.
 *
 * 접수목록(receptionList, care/patients)과의 관계 — 절반만 연결돼 있다(CareServiceImpl 확인):
 * - getPatients()는 여전히 TriageAssessment(KTAS) 기준으로 목록을 만든다.
 * - 다만 그 receptionId에 ReceptionIntake가 있으면, 목록의 patientName/receivedAt을
 *   그 실제값으로 채워준다(없으면 이전처럼 임시 mock 이름).
 * - 즉 "KTAS가 아직 없는, 접수만 된 환자"는 여기서 등록해도 여전히 목록에 안 뜬다.
 *   KTAS 있는 환자의 이름/접수시간을 채워주는 용도로만 지금은 연결돼 있다.
 */
export interface ReceptionIntake {
  receptionId: string;
  patientId: string;
  patientName: string;
  arrivalPath: string;
  receivedAt: string;
  memo: string | null;
  chiefComplaintRaw: string | null;
}

/** 백엔드 ReceptionIntakeCreateRequestDto 미러링. receptionId가 upsert 키다(재전송 시 덮어씀). */
export interface ReceptionIntakeCreateRequest {
  receptionId: string;
  patientId: string;
  patientName: string;
  arrivalPath: string;
  receivedAt: string;
  memo?: string;
  chiefComplaintRaw?: string;
}

/**
 * 내원경로 — 백엔드 CareServiceImpl.VALID_ARRIVAL_PATHS 고정값 미러링.
 * TODO: admin 공통코드로 이관되면(개발표준가이드 21.4) 다른 옵션들처럼 캐시 조회로 교체.
 */
export const ARRIVAL_PATH_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  // 119구급대
  { value: "EMS_119", label: "119 EMS" },
  // 도보내원
  { value: "WALK_IN", label: "Walk-in" },
  // 전원
  { value: "TRANSFER_IN", label: "Transfer In" },
  // 자가이송
  { value: "SELF_TRANSPORT", label: "Self Transport" },
];

export interface ReceptionIntakeState {
  submitting: boolean;
  submitError: string;
  /** 방금 등록/갱신한 접수 정보(성공 응답 그대로). 목록 조회 API가 없어 세션 메모리로만 표시. */
  lastIntake: ReceptionIntake | null;
}
