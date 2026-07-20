/**
 * imagingAcquisition(영상) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB005~LAB008 + LAB999 와 코드-문구를 맞춘다.
 * 백엔드 응답 message 가 코드(LAB###)로 내려오면 이 사전으로 문구 변환 후 노출한다. (요청서 1.1)
 */
export const IMAGING_ACQUISITION_MESSAGES = {
  LAB005: "영상 접수가 생성되었습니다.",
  LAB006: "조회된 영상 오더가 없습니다.",
  LAB007: "필수 항목이 누락되어 접수를 처리할 수 없습니다.",
  LAB008: "이미 접수된 오더입니다.",
  LAB999: "처리 중 오류가 발생했습니다.",
} as const;

export type ImagingAcquisitionMessageCode = keyof typeof IMAGING_ACQUISITION_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다. (요청서 1.1)
 */
export function resolveImagingAcquisitionMessage(codeOrMessage: string): string {
  if (codeOrMessage in IMAGING_ACQUISITION_MESSAGES) {
    return IMAGING_ACQUISITION_MESSAGES[
      codeOrMessage as ImagingAcquisitionMessageCode
    ];
  }
  return codeOrMessage;
}
