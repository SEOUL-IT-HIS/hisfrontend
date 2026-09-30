import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageScheduleCreateRequest,
  ImageScheduleItem,
  ImageScheduleRescheduleRequest,
  ImageScheduleResponse,
} from "@/features/labimaging/imagingschedule/types";

const IMAGE_SCHEDULE_PATH = "/api/lab-imaging/image-schedules";
const IMAGE_RESCHEDULE_PATH =
  "/api/lab-imaging/image-schedules/{imageReceptionId}/reschedule";

/**
 * 접수 1건의 촬영항목을 최종 일정과 함께 조회한다.
 * GET /api/lab-imaging/image-schedules/receptions/{receptionNo}
 *
 * ⚠ 일정이 아니라 "촬영항목"이 행 단위다. 아직 일정이 없는 항목도 함께 온다(schedule 없음).
 *   등록 화면이 필요로 하는 건 바로 그 미등록 항목이라, 일정 기준으로 뽑으면 화면이 성립하지 않는다.
 *
 * ⚠ 접수 상세(GET /image-orders/receptions/{receptionNo})로는 대체할 수 없다.
 *   그쪽은 imageItemCodes(코드 문자열)만 주고 항목ID를 주지 않아 등록 대상을 지목할 수 없다.
 */
export async function fetchImageScheduleItems(
  receptionNo: string,
): Promise<ImageScheduleItem[]> {
  const { data } = await apiClient.get<ApiResponse<ImageScheduleItem[]>>(
    IMAGE_SCHEDULE_PATH + "/receptions/" + encodeURIComponent(receptionNo),
  );
  return data.data;
}

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
