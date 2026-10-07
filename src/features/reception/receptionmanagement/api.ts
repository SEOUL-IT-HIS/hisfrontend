import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type {
  ReceptionListItem,
  ReceptionDetail,
  ReceptionListQuery,
  ReceptionRegisterRequest,
  ReceptionCancelRequest,
  DepartmentOption,
  DoctorOption,
  ReservationItem,
  ReservationRegisterRequest,
  VisitTypeResult,
} from "./types";

const RECEPTION_PATH = "/api/reception";
const DEPARTMENT_PATH = "/api/reception/departments";
const RESERVATION_PATH = "/api/reception/reservations";

export async function getReceptionList(
  query: ReceptionListQuery,
): Promise<ReceptionListItem[]> {
  const { data } = await apiClient.get<ApiResponse<ReceptionListItem[]>>(
    RECEPTION_PATH,
    { params: query },
  );
  return data.data;
}

export async function getReceptionDetail(
  receptionId: string,
): Promise<ReceptionDetail> {
  const { data } = await apiClient.get<ApiResponse<ReceptionDetail>>(
    `${RECEPTION_PATH}/${receptionId}`,
  );
  return data.data;
}

export async function registerReception(
  request: ReceptionRegisterRequest,
): Promise<ReceptionDetail> {
  const { data } = await apiClient.post<ApiResponse<ReceptionDetail>>(
    RECEPTION_PATH,
    request,
  );
  return data.data;
}

export async function cancelReception(
  request: ReceptionCancelRequest,
): Promise<void> {
  const { receptionId, ...body } = request;
  await apiClient.patch<ApiResponse<void>>(
    `${RECEPTION_PATH}/${receptionId}/cancel`,
    body,
  );
}

export async function getDepartments(): Promise<DepartmentOption[]> {
  const { data } =
    await apiClient.get<ApiResponse<DepartmentOption[]>>(DEPARTMENT_PATH);
  return data.data;
}

export async function getDoctors(deptId: string): Promise<DoctorOption[]> {
  const { data } = await apiClient.get<ApiResponse<DoctorOption[]>>(
    `${DEPARTMENT_PATH}/${deptId}/doctors`,
  );
  return data.data;
}

/**
 * 환자의 외래 진료 이력으로 초진/재진 판정 — 기록이 없으면 초진, 있으면 재진.
 * 외래 서비스 장애·미연동이면 determined=false 로 오므로 화면에서 직접 선택하게 한다.
 */
export async function getVisitType(patientId: string): Promise<VisitTypeResult> {
  const { data } = await apiClient.get<ApiResponse<VisitTypeResult>>(
    `${RECEPTION_PATH}/patients/${patientId}/visit-type`,
  );
  return data.data;
}

export async function getReservationList(): Promise<ReservationItem[]> {
  const { data } = await apiClient.get<ApiResponse<ReservationItem[]>>(
    RESERVATION_PATH,
  );
  return data.data;
}

export async function cancelReservation(reservationId: string): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(
    `${RESERVATION_PATH}/${reservationId}/cancel`,
  );
}

export async function registerReservation(
  request: ReservationRegisterRequest,
): Promise<void> {
  await apiClient.post<ApiResponse<void>>(RESERVATION_PATH, request);
}
