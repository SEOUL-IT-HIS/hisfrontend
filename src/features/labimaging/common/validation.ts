/**
 * 결과값 숫자 형식 사전 검증. (04번 지시서 Phase 3-A, 2026-10-05)
 *
 * 백엔드 labresult/service/AbnormalYnDecider.isNumericRange/isNumeric/isValidNumericRangeOrder
 * 와 같은 기준이다. 서버가 최종 판단하고 거절하면 LAB105/106 으로 응답하므로, 이 모듈은
 * 그 거절을 요청을 보내기 전에 화면에서 먼저 보여주는 용도다 — 기준이 서버와 갈리면
 * "화면은 통과시켰는데 서버가 막는다"는 혼란이 생기므로 로직을 베끼지 않고 그대로 옮긴다.
 *
 * ⚠ labimaging 전용이다. 다른 서비스 결과값은 이 규칙(참고범위 "min-max" 표기)을 따르지 않을
 *   수 있어 공통(features/common)에 두지 않는다.
 */

/**
 * 결과값이 "엄격한 십진수"인지 판별하는 정규식. (백엔드 AbnormalYnDecider.STRICT_DECIMAL 과 동일)
 * 지수(1e3)·접미사(4.2f)·NaN·Infinity·쉼표(4,2)·앞뒤 공백 포함 입력을 모두 거부한다.
 */
const STRICT_DECIMAL = /^[+-]?\d+(\.\d+)?$/;

/** 참고범위가 "min-max" 형태로 숫자 두 개로 읽히는지. (범위 경계 자체는 느슨하게 숫자인지만 본다) */
export function isNumericRange(referenceRange: string): boolean {
  const bounds = referenceRange.split("-");
  if (bounds.length !== 2) return false;
  const min = Number(bounds[0].trim());
  const max = Number(bounds[1].trim());
  return bounds[0].trim() !== "" && bounds[1].trim() !== "" && !Number.isNaN(min) && !Number.isNaN(max);
}

/** 문자열이 엄격한 십진수로 읽히는지 (지수·NaN·Infinity·접미사·쉼표·단위는 전부 false). */
export function isNumeric(text: string): boolean {
  return STRICT_DECIMAL.test(text.trim());
}

/** 수치 범위의 하한이 상한보다 큰지 않은지(하한<=상한, 같아도 허용). isNumericRange 가 true 일 때만 의미가 있다. */
export function isValidNumericRangeOrder(referenceRange: string): boolean {
  const bounds = referenceRange.split("-");
  return Number(bounds[0].trim()) <= Number(bounds[1].trim());
}

/**
 * UUID 형식(8-4-4-4-12, 하이픈 포함 36자) 검증. (04번 지시서 Phase 4-2, 2026-10-05)
 * 백엔드 common/validation/InputFormatValidator.isUuid 와 같은 기준이다.
 */
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** 오늘 날짜를 `<input type="date">` 의 값 형식(YYYY-MM-DD)으로. 날짜 입력의 `max` 에 쓴다. */
export function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 지금을 `<input type="datetime-local">` 의 값 형식(YYYY-MM-DDTHH:mm)으로. 시각 입력의 `max` 에 쓴다. */
export function nowLocalInputValue(): string {
  const now = new Date();
  const date = todayInputValue();
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${date}T${hh}:${mi}`;
}

/** datetime-local 입력값이 지금보다 미래인지. 빈 값은 false(필수 여부는 별도 검증이 담당). */
export function isFutureDateTime(value: string): boolean {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

/**
 * 오더번호 입력 정규화. (04번 지시서 Phase 3-E-1, 2026-10-05)
 * 허용 문자 [A-Za-z0-9._-] 만 남기고 나머지는 제거하며, 앞뒤 공백도 없앤다.
 * 서버 DTO 의 @Pattern(수동 등록 폼 전용, LabOrderCreateRequestDto/ImageOrderCreateRequestDto)과 같은 규칙이다.
 */
const ORDER_NO_DISALLOWED = /[^A-Za-z0-9._-]/g;

export function normalizeOrderNo(value: string): string {
  return value.trim().replace(ORDER_NO_DISALLOWED, "");
}

/**
 * 코드 목록에 빈 값이 아닌 중복이 있는지. (04번 지시서 Phase 3-E-2)
 * 수동 접수 폼에서 같은 검사/촬영 항목을 두 번 고른 경우를 잡는다 — 서버는 LAB113 으로 거절한다.
 */
export function hasDuplicateItemCode(codes: string[]): boolean {
  const nonEmpty = codes.filter((code) => code.trim());
  return new Set(nonEmpty).size !== nonEmpty.length;
}

/**
 * 파일 업로드 크기·형식 사전 검증. (04번 지시서 Phase 3-D, 2026-10-05)
 *
 * ⚠ 숫자는 백엔드 기본값과 맞춘다(ImageFileService.imageMaxBytes / PathologyResultService.
 *   attachmentMaxBytes 의 @Value 기본값). 서버 설정이 바뀌면 여기도 같이 바꿔야 한다 — 서버
 *   쪽은 application.properties 를 건드리지 않고 코드 기본값만 바꾸는 방식이라(지시서 §0-4),
 *   이 상수들도 같은 식으로 코드에서만 관리한다.
 */
export const IMAGE_FILE_MAX_BYTES = 8 * 1024 * 1024; // 8MB
export const PATHOLOGY_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 확장자 허용 목록. accept 속성과 별개로 코드에서도 확인한다 — accept 는 파일 선택창의
 * 안내일 뿐이라 사용자가 "모든 파일" 필터로 바꿔 다른 형식을 그대로 고를 수 있다.
 */
const ALLOWED_IMAGE_EXTENSIONS = [".dcm", ".jpg", ".jpeg", ".png", ".tif", ".tiff"];
const ALLOWED_PATHOLOGY_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

function hasAllowedExtension(fileName: string, allowed: string[]): boolean {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

/** 영상 업로드 1건을 검증한다. 문제 없으면 null, 있으면 화면에 보여줄 영문 메시지. */
export function validateImageFile(file: File): string | null {
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > IMAGE_FILE_MAX_BYTES) {
    return `The file is too large (max ${(IMAGE_FILE_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB).`;
  }
  if (!hasAllowedExtension(file.name, ALLOWED_IMAGE_EXTENSIONS)) {
    return "Unsupported file type. Allowed: DICOM (.dcm), JPEG, PNG, TIFF.";
  }
  return null;
}

/** 병리 첨부 1건을 검증한다. 문제 없으면 null, 있으면 화면에 보여줄 영문 메시지. */
export function validatePathologyAttachment(file: File): string | null {
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  if (file.size > PATHOLOGY_ATTACHMENT_MAX_BYTES) {
    return `The file is too large (max ${(PATHOLOGY_ATTACHMENT_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB).`;
  }
  if (!hasAllowedExtension(file.name, ALLOWED_PATHOLOGY_EXTENSIONS)) {
    return "Unsupported file type. Allowed: JPEG, PNG, PDF.";
  }
  return null;
}

/**
 * 결과값이 비정상적으로 크거나(상한의 10배 이상) 작은지(하한이 0 이상인데 음수). (04번 지시서 Phase 4-4)
 * 제출을 막지 않는다 — ConfirmDialog 로 한 번 더 확인받는 용도다. 소수점 위치나 단위를
 * 잘못 입력했을 가능성이 높은 값을 거르기 위함이다(예: 4.2 를 42 로 입력).
 */
export function isSuspiciouslyExtreme(resultValue: string, referenceRange: string): boolean {
  if (!isNumericRange(referenceRange) || !isNumeric(resultValue)) {
    return false;
  }
  const bounds = referenceRange.split("-");
  const min = Number(bounds[0].trim());
  const max = Number(bounds[1].trim());
  const value = Number(resultValue.trim());
  if (value > max * 10) return true;
  if (min >= 0 && value < 0) return true;
  return false;
}

/**
 * 결과값 1건을 참고범위에 대해 검증한다. 문제가 없으면 null, 있으면 화면에 보여줄 영문 메시지.
 * 참고범위가 수치 범위가 아니면(정성, 미지원 표기, 빈 값) 검증하지 않고 null 을 돌려준다 —
 * 그 경우는 백엔드도 정성 비교로 넘어가 형식을 따지지 않는다(AbnormalYnDecider 클래스 주석 참고).
 *
 * ⚠ 쉼표가 섞인 입력은 "숫자가 아니다"보다 더 구체적인 문구를 준다 — 소수점을 쉼표로 적는
 *   입력 실수가 실제로 가장 흔하다(지시서 §3-A).
 */
export function validateNumericResult(resultValue: string, referenceRange: string): string | null {
  const range = referenceRange.trim();
  if (!isNumericRange(range)) {
    return null;
  }
  if (!isValidNumericRangeOrder(range)) {
    return "The reference range's lower bound is greater than its upper bound.";
  }
  const value = resultValue.trim();
  if (value && !isNumeric(value)) {
    if (value.includes(",")) {
      return "Please use a period (.) for the decimal point.";
    }
    return "The result value is not a valid number. The reference range is numeric.";
  }
  return null;
}
