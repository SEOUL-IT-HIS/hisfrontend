import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type { LabScheduleCreateRequest, LabScheduleRescheduleRequest, LabScheduleResponse 
} from "@/features/labimaging/labschedule/types";


const LAB_SCHEDULE_PATH = "/api/lab-imaging/lab-schedules";

const LAB_RESCHEDULE_PATH = "/api/lab-imaging/lab-schedules/{labReceptionId}/reschedule";


export async function createLabSchedule(
  request: LabScheduleCreateRequest,
): Promise<LabScheduleResponse> {
  const { data } = await apiClient.post<ApiResponse<LabScheduleResponse>>(
    LAB_SCHEDULE_PATH,
    request,
  );
  return data.data;
}

export async function rescheduleLabSchedule(
    labReceptionId: string,
  request: LabScheduleRescheduleRequest,
): Promise<LabScheduleResponse> {
  const { data } = await apiClient.post<ApiResponse<LabScheduleResponse>>(
    LAB_RESCHEDULE_PATH.replace("{labReceptionId}", labReceptionId),
    request,
  );
  return data.data;
}