/**
 * 검사결과(labresult) 타입 (UC-RST-01 일반검사결과등록 / Jira ZP2-13, 화면연동 ZP2-104)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다.
 * - LabResultCreateRequestDto / LabResultUpdateRequestDto / LabResultConfirmRequestDto
 *   / LabResultSummaryDto / LabResultItemDto
 *   (kr.co.seoulit.his.labimagingservice.labresult.dto)
 */

/**
 * 결과상태 — 공통코드 RESULT_STATUS_CD.
 *
 * ⚠ 값이 admin 공통코드라 화면에서 문구를 하드코딩하면 admin 과 어긋난다.
 *   그런데 이 두 값은 상태 전이(등록 → 확정)의 분기 조건이라 화면 로직이 값 자체를 알아야 한다.
 *   그래서 "분기용 상수"는 여기 두고, 사용자에게 보이는 문구는 아래 라벨을 쓴다.
 *   (검체의 FitnessStatus 와 같은 취급 — 다만 저쪽은 서버 Enum, 이쪽은 공통코드다)
 */
export const RESULT_STATUS = {
  /** 01 = 등록. 아직 검토 중이라 수정할 수 있다. */
  RECORDED: "01",
  /** 02 = 확정. 더 이상 수정할 수 없다. */
  CONFIRMED: "02",
} as const;

export type ResultStatusCode = (typeof RESULT_STATUS)[keyof typeof RESULT_STATUS];

export const RESULT_STATUS_LABELS: Record<string, string> = {
  "01": "Recorded",
  "02": "Confirmed",
};

/** 검사 결과 — 백엔드 LabResultSummaryDto */
export interface LabResultSummary {
  /** 수정·확정 API 의 경로변수 */
  labResultId: string;
  labOrderItemId: string;
  /** 검사항목코드 (공통코드 TEST_TYPE_CD) */
  labItemCode: string;
  resultValue: string;
  resultUnit?: string;
  referenceRange?: string;
  /**
   * 비정상 여부 (Y/N).
   * ⚠ 화면이 정하지 않는다. 서버가 참고범위와 결과값을 비교해 계산한 값이다. (ZP2-99)
   */
  abnormalYn: "Y" | "N";
  /** 공통코드 RESULT_STATUS_CD — 01=등록, 02=확정 */
  resultStatusCode: string;
  recordedAt: string;
  recordedById: string;
  /** 확정 전이면 없음(undefined) */
  confirmedAt?: string;
  confirmedById?: string;
}

/**
 * 검사항목 1건 + 그 항목의 결과 — 백엔드 LabResultItemDto
 *
 * ⚠ result 가 없으면(undefined) 아직 결과가 등록되지 않은 항목이다. 그게 등록 대상이다.
 *   (검체 목록에서 fitnessStatus 가 없으면 미판정인 것과 같은 규약)
 */
export interface LabResultItem {
  /** 결과 등록 요청에 담는 값 */
  labOrderItemId: string;
  /** 검사항목코드 (공통코드 TEST_TYPE_CD) */
  labItemCode: string;
  result?: LabResultSummary;
}

/**
 * 결과 등록 요청 — 백엔드 LabResultCreateRequestDto
 *
 * ⚠ 서버가 정하는 값은 담지 않는다. 담아 보내도 서버가 무시한다.
 *   - abnormalYn       : 참고범위와 비교해 서버가 계산 (ZP2-99)
 *   - resultStatusCode : 등록은 언제나 "01"에서 시작한다
 *   - recordedAt       : 서버 시각
 */
export interface LabResultCreateRequest {
  labOrderItemId: string;
  resultValue: string;
  resultUnit?: string;
  /**
   * 참고범위 — "정상으로 보는 값".
   * 정량은 "3.5-5.5", 정성은 "음성" 형태. 쉼표로 여러 정상값을 줄 수 있다.
   * 비우면 서버가 정상/비정상을 판정하지 않고 N 으로 둔다.
   */
  referenceRange?: string;
  recordedById: string;
}

/**
 * 결과 수정 요청 — 백엔드 LabResultUpdateRequestDto
 *
 * ⚠ 대상 항목(labOrderItemId)과 입력자(recordedById)는 담지 않는다.
 *   결과가 붙을 항목을 옮기는 건 수정이 아니고, 최초 입력자를 바꾸는 건 기록 조작이다.
 */
export interface LabResultUpdateRequest {
  resultValue: string;
  resultUnit?: string;
  referenceRange?: string;
}

/** 결과 확정 요청 — 백엔드 LabResultConfirmRequestDto */
export interface LabResultConfirmRequest {
  confirmedById: string;
}

/** 검사결과 slice 상태 */
export interface LabResultState {
  /** 선택한 접수의 검사항목 + 결과 목록 */
  items: LabResultItem[];
  itemsLoading: boolean;
  itemsError: string;

  /** 등록/수정/확정 공용 진행 상태 — 셋이 동시에 일어나지 않아 하나로 둔다 */
  submitting: boolean;
  submitError: string;
  /** 마지막 등록/수정/확정 성공 결과 — 성공 안내와 워크리스트 갱신 신호로 쓴다 */
  lastSubmitted: LabResultSummary | null;
}
