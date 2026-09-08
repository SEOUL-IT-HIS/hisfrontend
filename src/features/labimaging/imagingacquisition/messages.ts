/**
 * 촬영/영상파일(imagingacquisition) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB048~LAB056 과 코드-문구를 맞춘다.
 * 문구 언어는 12.4 화면 텍스트 언어 원칙에 따라 영문이다.
 */
export const IMAGE_FILE_MESSAGES = {
  LAB015: "Imaging reception not found.",
  LAB047: "This item does not belong to the selected reception.",
  LAB048: "Image file has been registered.",
  LAB049: "Image files loaded successfully.",
  LAB050: "Image file not found.",
  LAB051: "Patient information does not match.",
  LAB052: "Consent has not been registered. Please register consent before imaging.",
  LAB053: "Imaging schedule has not been registered. Please register a schedule first.",
  LAB054: "This file type is not allowed.",
  LAB055: "Could not connect to the image storage. Please try again shortly.",
  LAB056: "Failed to save the image file. The upload has been cancelled.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type ImageFileMessageCode = keyof typeof IMAGE_FILE_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리)
 */
export function resolveImageFileMessage(codeOrMessage: string): string {
  if (codeOrMessage in IMAGE_FILE_MESSAGES) {
    return IMAGE_FILE_MESSAGES[codeOrMessage as ImageFileMessageCode];
  }
  return codeOrMessage;
}
