/**
 * 촬영/영상파일(imagingacquisition) 타입 — UC-IMG-03 (Jira ZP2-21)
 *
 * 필드명은 백엔드 DTO 를 그대로 미러링한다.
 * - ImageFileUploadRequestDto / ImageFileSummaryDto
 *   (kr.co.seoulit.his.labimagingservice.imagingacquisition.dto)
 *
 * ⚠ 이 기능의 실제 범위는 "촬영 수행 + 영상파일 저장"이다. 판독(Reading) 자체는
 *   별도 기능(ZP2-23, imaginginterpretation)이라 여기서 다루지 않는다.
 */

/** 영상파일 — 백엔드 ImageFileSummaryDto */
export interface ImageFileSummary {
  imageFileId: string;
  imageOrderItemId: string;
  fileName: string;
  /** 바이트. 브라우저의 File.size 와 같은 단위라 그대로 KB/MB 로 환산해 보여준다. */
  fileSize?: number;
  contentType: string;
  uploadedAt: string;
  uploadedById: string;
}

/**
 * 영상파일 업로드 요청 — 백엔드 ImageFileUploadRequestDto
 *
 * ⚠ 백엔드는 이 값들을 multipart/form-data 로 받는다(JSON 이 아니다). 이 인터페이스는
 *   "무엇을 보내야 하는지"를 미러링한 것이고, 실제 전송은 api.ts 가 FormData 로 만든다.
 *
 * ⚠ imageReceptionId 를 함께 보낸다. 백엔드가 사전요건 중 "촬영 일정이 등록되어 있는지"를
 *   확인하려면 접수+항목 조합이 필요한데(ImageScheduleService 와 같은 이유),
 *   imageOrderItemId 만으로는 그 일정을 찾을 수 없다.
 *   (ImageAcquisitionWorkPanel 의 prop 이 ImageWorklistItem 이라 imageReceptionId 는 이미 있다)
 */
export interface ImageFileUploadRequest {
  file: File;
  imageReceptionId: string;
  imageOrderItemId: string;
  patientId: string;
  uploadedById: string;
}

/**
 * ⚠ 촬영항목을 고르는 목록은 이 파일에 따로 두지 않는다.
 *   백엔드 워크리스트 응답(ImageWorklistItemDto)에는 항목 목록이 없다(접수 단위 요약이라
 *   imageItemCount 개수만 있다). 대신 imagingschedule 기능이 이미 같은 목적으로 쓰고 있는
 *   ImageScheduleItem({ imageOrderItemId, imageItemCode, schedule? })과
 *   fetchImageScheduleItemsRequest(receptionNo)/selectImageScheduleItems 를 그대로 재사용한다.
 *   (ImageScheduleRegisterForm 의 "2단 구조"와 같은 방식 — ImageAcquisitionWorkPanel 참고)
 *   같은 목적의 목록 조회를 두 번 만들지 않기 위한 선택이고, 덤으로 각 항목에 일정이
 *   있는지(schedule 유무)도 같이 보여 사전요건(촬영 일정 필요)을 화면에서 미리 안내할 수 있다.
 */

/** 촬영/영상파일(imagingacquisition) slice 상태 */
export interface ImageFileState {
  /** 선택한 촬영항목의 영상파일 목록 */
  files: ImageFileSummary[];
  filesLoading: boolean;
  filesError: string;
  /**
   * files 가 어느 항목의 것인지.
   * ⚠ 이 값이 없으면 다른 항목을 고른 직후 한 프레임 동안 이전 항목의 파일 목록이 그대로 보인다.
   *   (ConsentState.loadedImageOrderId 와 같은 방어)
   */
  loadedImageOrderItemId: string | null;

  uploading: boolean;
  uploadError: string;
  /** 마지막 업로드 성공 결과 — 성공 안내와 워크리스트 갱신 신호로 쓴다 */
  lastUploaded: ImageFileSummary | null;
}
