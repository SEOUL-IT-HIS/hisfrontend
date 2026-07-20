/** admin-service 공통코드 조회 타입 */

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** GET /api/common-codes 응답 항목 */
export type CommonCodeItem = {
  codeId: number;
  groupId: number;
  parentCodeId: number | null;
  codeValue: string;
  codeName: string;
  sortOrder: number | null;
  useYn: string;
};

export type CreateCommonCodeRequest = {
  groupId: number;
  parentCodeId?: number | null;
  codeValue: string;
  codeName: string;
  sortOrder?: number | null;
  useYn?: string;
};

export type UpdateCommonCodeRequest = {
  parentCodeId?: number | null;
  codeValue: string;
  codeName: string;
  sortOrder?: number | null;
  useYn: string;
};

/** 공통코드 그룹 */
export type CommonCodeGroup = {
  groupId: number;
  groupCode: string;
  groupName: string;
  useYn: string;
};

export type CreateCommonCodeGroupRequest = {
  groupCode: string;
  groupName: string;
  useYn?: string;
};

export type UpdateCommonCodeGroupRequest = {
  groupName: string;
  useYn: string;
};

/** 업무에서 자주 쓰는 그룹코드 */
export const CODE_GROUP = {
  DEPT_CD: "DEPT_CD",
  EMP_STATUS_CD: "EMP_STATUS_CD",
} as const;

export type CodeGroupId = (typeof CODE_GROUP)[keyof typeof CODE_GROUP];
