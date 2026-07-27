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
    codeName: string;
    useYn: string;
};

export type CommonCodeItemApiResponse = ApiResponse<CommonCodeItem[]>;
