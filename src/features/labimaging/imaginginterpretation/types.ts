/**
 * 영상판독(imaginginterpretation) 타입 — UC-IMG-04 영상판독처리 (Jira ZP2-23)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다.
 * - ImageReadingSummaryDto / ImageReadingAssignRequestDto / ImageReadingFindingsRequestDto
 *   / ImageReadingConfirmRequestDto
 *   (kr.co.seoulit.his.labimagingservice.imaginginterpretation.dto)
 *
 * ⚠ DICOM 뷰어·윈도잉 등 전문 판독 기능은 범위 밖이다. (2026-08-31 결정)
 *   영상은 기존 imagingacquisition 파일 목록/다운로드 API 로 그대로 <img> 에 띄운다.
 */

/**
 * 판독상태 — 공통코드 READING_STATUS_CD.
 *
 * ⚠ 값이 admin 공통코드라 화면에서 문구를 하드코딩하면 admin 과 어긋난다.
 *   그런데 이 값들은 상태 전이(대기 → 판독중 → 확정)의 분기 조건이라 화면 로직이 값 자체를
 *   알아야 한다. 그래서 "분기용 상수"는 여기 두고, 사용자에게 보이는 문구는 아래 라벨을 쓴다.
 *   (labresult RESULT_STATUS 와 같은 취급)
 */
export const READING_STATUS = {
  /** 01 = 대기. 촬영은 끝났지만 아직 담당자가 배정되지 않았다. */
  WAITING: "01",
  /** 02 = 판독중. 담당자가 배정되어 소견을 작성 중이다. */
  IN_PROGRESS: "02",
  /** 03 = 완료(확정). 더 이상 배정·소견수정·재확정을 할 수 없다. */
  CONFIRMED: "03",
} as const;

export type ReadingStatusCode = (typeof READING_STATUS)[keyof typeof READING_STATUS];

export const READING_STATUS_LABELS: Record<string, string> = {
  "01": "Waiting",
  "02": "In Progress",
  "03": "Confirmed",
};

/**
 * 영상판독 — 백엔드 ImageReadingSummaryDto (워크리스트/상세 공용)
 *
 * ⚠ 워크리스트 행과 상세 화면이 같은 타입을 쓴다. 판독은 촬영항목 1건에 1건뿐이라
 *   목록의 한 줄과 상세의 내용이 같은 모양이기 때문이다. (LabResultSummary 와 같은 이유)
 */
export interface ImageReadingSummary {
  /** 배정·소견입력·확정 API 의 경로변수 */
  imageReadingId: string;
  imageOrderItemId: string;
  /** 촬영항목코드 (공통코드 IMG_ITEM_CD) */
  imageItemCode: string;
  /** 오더ID — 화면 표시용이 아니라 "이 접수/오더의 판독 목록"을 걸러내는 열쇠 */
  imageOrderId: string;
  /** 환자ID — 화면 표시용이 아니라 환자명 조회에 쓰는 값 */
  patientId: string;
  /** 응급여부 (Y/N) — 판독 워크리스트 정렬 기준(서버가 정렬해 내려준다) */
  urgencyYn: "Y" | "N";
  /** 공통코드 READING_STATUS_CD — 01=대기, 02=판독중, 03=완료 */
  readingStatusCode: string;
  /** 미배정이면 없음(undefined) */
  assignedToId?: string;
  assignedAt?: string;
  /** 미입력이면 없음(undefined) */
  findings?: string;
  /** 확정 전이면 없음(undefined) */
  signedById?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 판독 담당자 배정 요청 — 백엔드 ImageReadingAssignRequestDto */
export interface ImageReadingAssignRequest {
  assignedToId: string;
}

/** 판독 소견 입력/수정 요청 — 백엔드 ImageReadingFindingsRequestDto (확정 전만 가능) */
export interface ImageReadingFindingsRequest {
  findings: string;
}

/** 판독 확정(전자서명) 요청 — 백엔드 ImageReadingConfirmRequestDto */
export interface ImageReadingConfirmRequest {
  signedById: string;
}

/** 영상판독(imaginginterpretation) slice 상태 */
export interface ImageReadingState {
  /** 판독 워크리스트 — 영상파일이 1건 이상인 촬영항목 전체(findOrCreate 로 채워짐) */
  worklist: ImageReadingSummary[];
  worklistLoading: boolean;
  worklistError: string;

  /** 선택한 촬영항목의 판독 상세 (findOrCreate) */
  detail: ImageReadingSummary | null;
  detailLoading: boolean;
  detailError: string;
  /**
   * detail 이 어느 촬영항목의 것인지.
   * ⚠ 이 값이 없으면 다른 항목을 고른 직후 한 프레임 동안 이전 항목의 상세가 그대로 보인다.
   *   (ImageFileState.loadedImageOrderItemId 와 같은 방어)
   */
  loadedImageOrderItemId: string | null;

  /** 배정/소견저장/확정 공용 진행 상태 — 셋이 동시에 일어나지 않아 하나로 둔다. (LabResultState 와 같은 이유) */
  submitting: boolean;
  submitError: string;
  lastSubmitted: ImageReadingSummary | null;
}
