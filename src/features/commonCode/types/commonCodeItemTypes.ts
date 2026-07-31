/**
 * [공통코드 항목 타입]
 * admin-service CommonCodeItemEntity / DTO 와 필드명 맞춤
 */

/** API 공통 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 항목 한 행 */
export type CommonCodeItem = {
  codeId: number;
  groupId: number;
  codeValue: string;
  codeName: string;
  useYn: string; // "Y" | "N"
};

/** 항목 등록 요청 — codeValue 는 등록 시에만 입력 */
export type CommonCodeItemRegisterRequest = Pick<
  CommonCodeItem,
  "groupId" | "codeValue" | "codeName" | "useYn"
>;

/**
 * 항목 수정 요청
 * - codeValue 는 식별키라 수정 body 에 넣지 않음
 */
export type CommonCodeItemUpdateRequest = {
  codeId: number;
  codeName: string;
  useYn: string;
};

export type CommonCodeItemApiResponse = ApiResponse<CommonCodeItem[]>;
