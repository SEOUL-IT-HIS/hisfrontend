/**
 * [공통코드 그룹 타입]
 * admin-service CommonCodeGroupEntity / DTO 와 필드명 맞춤
 */

/** API 공통 응답 래퍼 { code, message, data } */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 그룹 한 행 (목록/등록 응답) */
export type CommonCodeGroup = {
  groupId: number;
  groupCode: string;
  groupName: string;
  useYn: string; // "Y" | "N"
};

/**
 * 그룹 수정 요청
 * - groupCode 는 식별키라 수정 API body 에 넣지 않음
 */
export type CommonCodeGroupUpdateRequest = {
  groupId: number;
  groupName: string;
  useYn: string;
};

export type CommonCodeGroupApiResponse = ApiResponse<CommonCodeGroup[]>;
