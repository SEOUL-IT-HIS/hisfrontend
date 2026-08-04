import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageScheduleCreateRequest,
  ImageScheduleRescheduleRequest,
  ImageScheduleResponse,
} from "@/features/labimaging/imagingschedule/types";

const IMAGE_SCHEDULE_PATH = "/api/lab-imaging/image-schedules";
const IMAGE_RESCHEDULE_PATH =
  "/api/lab-imaging/image-schedules/{imageReceptionId}/reschedule";

export async function createImageSchedule(
  request: ImageScheduleCreateRequest,
): Promise<ImageScheduleResponse> {
  const { data } = await apiClient.post<ApiResponse<ImageScheduleResponse>>(
    IMAGE_SCHEDULE_PATH,
    request,
  );
  return data.data;
}

export async function rescheduleImageSchedule(
  imageReceptionId: string,
  request: ImageScheduleRescheduleRequest,
): Promise<ImageScheduleResponse> {
  const { data } = await apiClient.post<ApiResponse<ImageScheduleResponse>>(
    IMAGE_RESCHEDULE_PATH.replace("{imageReceptionId}", imageReceptionId),
    request,
  );
  return data.data;
}
