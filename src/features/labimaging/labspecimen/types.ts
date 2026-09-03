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
  BLOOD: "Blood",
  URINE: "Urine",
  STOOL: "Stool",
  SPUTUM: "Sputum",
};

export const SPECIMEN_TYPE_OPTIONS: ReadonlyArray<{
  value: SpecimenType;
  label: string;
}> = [
  { value: "BLOOD", label: "Blood" },
  { value: "URINE", label: "Urine" },
  { value: "STOOL", label: "Stool" },
  { value: "SPUTUM", label: "Sputum" },
];

/** 적합상태 — 백엔드 labspecimen/entity/FitnessStatus enum 미러링. 미판정이면 값이 없다. */
export type FitnessStatus = "FIT" | "UNFIT";

export const FITNESS_STATUS_LABELS: Record<FitnessStatus, string> = {
  FIT: "Fit",
  UNFIT: "Unfit",
};

export const FITNESS_STATUS_OPTIONS: ReadonlyArray<{
  value: FitnessStatus;
  label: string;
}> = [
  { value: "FIT", label: "Fit" },
  { value: "UNFIT", label: "Unfit" },
];

/** 재채취 요청 여부. 공통코드가 아니라 API 계약상 고정값이라 상수로 둔다. */
export const RECOLLECTION_YN_OPTIONS: ReadonlyArray<{
  value: "Y" | "N";
  label: string;
}> = [
  { value: "N", label: "Not requested" },
  { value: "Y", label: "Request recollection" },
];

/** 검체 등록 요청 — 백엔드 SpecimenCreateRequestDto */
export interface SpecimenCreateRequest {
  /** 대상 접수ID (UUID) */
  labReceptionId: string;
  /** 검체용기코드 (공통코드 SPECIMEN_CONTAINER_CD) */
  specimenContainerCode: string;
  specimenType: SpecimenType;
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
  collectedAt: string;
  collectedById: string;
  /** 미판정이면 없음(undefined) */
  fitnessStatus?: FitnessStatus;
}

/**
 * 검체 인수 + 적합성 판정 요청 — 백엔드 SpecimenAcceptanceRequestDto
 *
 * ⚠ 대상 검체(specimenId)는 이 타입에 담지 않는다. 경로변수로 보낸다.
 *   이미 존재하는 검체를 지목하는 행위라, 일정 재조정과 같은 규칙을 따른다.
 *
 * ⚠ 인수와 판정이 한 요청이다. SPECIMEN_ACCEPTANCE 는 인수정보와 판정결과가 한 행이고
 *   셋 다 NOT NULL 이라 "인수만 하고 판정은 나중에" 라는 중간 상태가 없다.
 */
export interface SpecimenAcceptanceRequest {
  /** 인수일시 (ISO) */
  acceptedAt: string;
  acceptedById: string;
  fitnessStatus: FitnessStatus;
  /** 부적합사유코드 (공통코드 SPECIMEN_REJECT_CD). 부적합일 때만 보낸다. */
  unfitReasonCode?: string;
  recollectionRequestedYn: "Y" | "N";
}

/** 검체 인수/적합성 판정 응답 — 백엔드 SpecimenAcceptanceSummaryDto */
export interface SpecimenAcceptanceSummary {
  specimenId: string;
  receptionNo: string;
  specimenBarcode: string;
  specimenType: SpecimenType;
  acceptedAt: string;
  acceptedById: string;
  fitnessStatus: FitnessStatus;
  unfitReasonCode?: string;
  recollectionRequestedYn: "Y" | "N";
}

/**
 * 바코드 대조 결과 (ZP2-75)
 *
 * ⚠ 서버가 판단하지 않는 값이다. 서버는 바코드로 검체를 찾아 주기만 하고,
 *   그게 "지금 보고 있는 접수의 검체인지"는 화면만 알 수 있어 여기서 정한다.
 *   그래서 메시지 코드(LAB###)가 아니라 화면 전용 구분값이다.
 *
 * ⚠ OTHER_RECEPTION 은 접수가 다르다는 뜻이고, 그것이 곧 환자·오더가 다르다는 뜻이다.
 *   SPECIMEN → LAB_RECEPTION → LAB_ORDER → patient_id 로 이어지므로
 *   접수번호가 같으면 환자와 오더도 같다. 환자를 따로 조회할 필요가 없다.
 */
export type BarcodeMatchKind =
  /** 이 접수의 미판정 검체 — 판정 대상으로 고른다 */
  | "OK"
  /** 다른 접수의 검체 — 고르지 않고 그 검체의 접수번호를 알려준다 */
  | "OTHER_RECEPTION"
  /** 이 접수의 검체지만 이미 판정이 끝남 — 고르지 않는다 (검체 1건당 판정 1건) */
  | "JUDGED";

export interface BarcodeMatch {
  kind: BarcodeMatchKind;
  specimen: SpecimenSummary;
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

  /** 적합성 판정 진행 상태 */
  accepting: boolean;
  acceptError: string;
  /** 마지막 판정 성공 결과 — 성공 안내와 워크리스트 갱신 신호로 쓴다 */
  lastAccepted: SpecimenAcceptanceSummary | null;

  /** 바코드 조회 (ZP2-75) */
  barcodeLookupLoading: boolean;
  barcodeLookupError: string;
  /**
   * 바코드로 찾은 검체. 대조 결과와 무관하게 조회된 원본을 담는다.
   * 다른 접수의 검체여도 지운 뒤 담지 않는다 — 그 검체의 접수번호를 화면에 알려줘야 하기 때문이다.
   */
  barcodeLookupResult: SpecimenSummary | null;
}
