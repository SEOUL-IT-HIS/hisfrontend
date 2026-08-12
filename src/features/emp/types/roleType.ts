export type RoleType = {
    roleId: string;
    roleCode: string;
    roleName: string;
    roleDescription: string;
    useYn: string;
};

export type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};