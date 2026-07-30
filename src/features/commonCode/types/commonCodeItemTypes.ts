/** admin-service ApiResponse 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** GET /api/commonCodeItem/list 한 행 */
export type CommonCodeItem = {
  codeId: number;
  groupId: number;
  codeValue: string;
  codeName: string;
  useYn: string;
};

/** POST /api/commonCodeItem/register 요청 body */
export type CommonCodeItemRegisterRequest = Pick<
  CommonCodeItem,
  "groupId" | "codeValue" | "codeName" | "useYn"
>;

/** PUT /api/commonCodeItem/update/{codeId} 요청 body */
export type CommonCodeItemUpdateRequest = {
  codeId: number;
  codeName: string;
  useYn: string;
};

export type CommonCodeItemApiResponse = ApiResponse<CommonCodeItem[]>;
