/** admin-service ApiResponse 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** GET /api/commonCodeGroup/list 한 행 */
export type CommonCodeGroup = {
  groupId: number;
  groupCode: string;
  groupName: string;
  useYn: string;
};

/** PUT /api/commonCodeGroup/update/{groupId} 요청 body */
export type CommonCodeGroupUpdateRequest = {
  groupId: number;
  groupName: string;
  useYn: string;
};

export type CommonCodeGroupApiResponse = ApiResponse<CommonCodeGroup[]>;
