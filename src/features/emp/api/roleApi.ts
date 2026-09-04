import apiClient from "@/lib/axios";




import {RoleType, ApiResponse} from "@/features/emp/types/roleType";



/** 역할 목록 조회 */
export async function fetchRoleListApi(): Promise<RoleType[]> {
    const response = await apiClient.get<ApiResponse<RoleType[]>>("/api/role/list");
    return response.data.data ?? [];
}