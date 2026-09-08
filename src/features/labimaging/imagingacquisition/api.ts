import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageFileSummary,
  ImageFileUploadRequest,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * 촬영/영상파일 API 경로
 * (백엔드 ImageFileController @RequestMapping("/api/lab-imaging/image-files"))
 */
const IMAGE_FILE_PATH = "/api/lab-imaging/image-files";

/**
 * 촬영항목 1건의 영상파일 목록을 조회한다.
 * GET /api/lab-imaging/image-files?imageOrderItemId={imageOrderItemId} → 200 + ImageFileSummaryDto[]
 */
export async function fetchImageFilesByOrderItemId(
  imageOrderItemId: string,
): Promise<ImageFileSummary[]> {
  const { data } = await apiClient.get<ApiResponse<ImageFileSummary[]>>(
    IMAGE_FILE_PATH,
    { params: { imageOrderItemId } },
  );
  return data.data;
}

/**
 * 영상파일을 업로드한다. (ZP2-105/106/108)
 * POST /api/lab-imaging/image-files (multipart/form-data) → 201 + ImageFileSummaryDto
 *
 * ⚠ apiClient(lib/axios.ts)의 기본 헤더가 Content-Type: application/json 이다.
 *   FormData 를 보낼 때 이 값을 지우지 않으면, axios 가 "JSON Content-Type + FormData"
 *   조합을 보고 FormData 를 일반 객체로 직렬화해(formToJSON) 버려 파일 내용이 통째로
 *   사라진다 — 네트워크 탭에는 요청이 보내지는데 서버에는 파일이 도착하지 않는 증상으로 나타난다.
 *   headers 를 undefined 로 넘기면 이 요청에서만 Content-Type 이 비워지고, axios 가
 *   FormData 를 보고 boundary 를 포함한 multipart/form-data 를 브라우저에 맡겨 채운다.
 *   (이 프로젝트 최초의 파일 업로드라 다른 곳에 참고할 전례가 없다 — 여기 남겨 둔다)
 *
 * ⚠ 실패(사전요건 위반 등)는 400 대 + ApiResponse.fail 로 온다. axios 인터셉터가
 *   error.response.data.message 를 Error 로 바꿔 주므로 saga 는 다른 API 와 동일하게 처리한다.
 */
export async function uploadImageFile(
  request: ImageFileUploadRequest,
): Promise<ImageFileSummary> {
  const formData = new FormData();
  formData.append("file", request.file);
  formData.append("imageReceptionId", request.imageReceptionId);
  formData.append("imageOrderItemId", request.imageOrderItemId);
  formData.append("patientId", request.patientId);
  formData.append("uploadedById", request.uploadedById);

  const { data } = await apiClient.post<ApiResponse<ImageFileSummary>>(
    IMAGE_FILE_PATH,
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return data.data;
}
