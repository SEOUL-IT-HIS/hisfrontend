/**
 * 검체(labspecimen) 타입 (UC-SPC-03 검체식별관리 / UC-SPC-04 검체적합성판정)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다.
 * - SpecimenCreateRequestDto / SpecimenSummaryDto
 *   (kr.co.seoulit.his.labimagingservice.labspecimen.dto)
 */

/**
 * 검체종류 — 백엔드 labspecimen/entity/SpecimenType enum 미러링.
 *
 * ⚠ 공통코드가 아니라 서비스 내부 Enum 이라 admin 조회로는 못 가져온다.
 *   백엔드 enum 에 값이 추가되면 여기도 같이 추가해야 한다.
 *   (검체용기코드는 반대로 공통코드 SPECIMEN_CONTAINER_CD 라서 admin 에서 불러온다)
 */
export type SpecimenType = "BLOOD" | "URINE" | "STOOL" | "SPUTUM";

export const SPECIMEN_TYPE_LABELS: Record<SpecimenType, string> = {
  BLOOD: "혈액",
  URINE: "소변",
  STOOL: "대변",
  SPUTUM: "객담",
};

export const SPECIMEN_TYPE_OPTIONS: ReadonlyArray<{
  value: SpecimenType;
  label: string;
}> = [
  { value: "BLOOD", label: "혈액" },
  { value: "URINE", label: "소변" },
  { value: "STOOL", label: "대변" },
  { value: "SPUTUM", label: "객담" },
];

/** 적합상태 — 백엔드 labspecimen/entity/FitnessStatus enum 미러링. 미판정이면 값이 없다. */
export type FitnessStatus = "FIT" | "UNFIT";

export const FITNESS_STATUS_LABELS: Record<FitnessStatus, string> = {
  FIT: "적합",
  UNFIT: "부적합",
};

/** 검체 등록 요청 — 백엔드 SpecimenCreateRequestDto */
export interface SpecimenCreateRequest {
  /** 대상 접수ID (UUID) */
  labReceptionId: string;
  /** 검체용기코드 (공통코드 SPECIMEN_CONTAINER_CD) */
  specimenContainerCode: string;
  specimenType: SpecimenType;
  patientNo: string;
  /** 환자ID (patient-service 내부 식별자) */
  patientId: string;
  /** 검체채취일시 (ISO) */
  collectedAt: string;
  collectedById: string;
}

/** 검체 요약 (목록/단건 공용) — 백엔드 SpecimenSummaryDto */
export interface SpecimenSummary {
  /** 화면 표시용 아님 — 판정 화면 이동에 사용 */
  specimenId: string;
  receptionNo: string;
  specimenBarcode: string;
  specimenType: SpecimenType;
  specimenContainerCode: string;
  patientNo: string;
  collectedAt: string;
  collectedById: string;
  /** 미판정이면 없음(undefined) */
  fitnessStatus?: FitnessStatus;
}

/** 검체 slice 상태 */
export interface SpecimenState {
  /** 선택한 접수의 검체 목록 */
  specimens: SpecimenSummary[];
  specimensLoading: boolean;
  specimensError: string;

  /** 검체 등록 진행 상태 */
  creating: boolean;
  createError: string;
  /** 마지막 등록 성공 결과 — 폼 초기화와 성공 안내에 쓴다 */
  lastCreated: SpecimenSummary | null;
}
