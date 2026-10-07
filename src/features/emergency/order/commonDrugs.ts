/**
 * 약품 처방 화면의 제형 폴백.
 * 자주 쓰는 약 목록은 두지 않는다 — 약품 코드는 약제 마스터 검색 결과(ediCode)로만 고른다(코드에 적어 둔 목록은 마스터와 어긋난다).
 * dosageFormCd 는 admin 공통코드 DOSAGE_FORM_CD: 01 Tablet/Capsule, 02 IV Fluid, 03 Injection.
 */

/** admin 공통코드 DOSAGE_FORM_CD 를 못 받을 때의 폴백 */
export const DOSAGE_FORM_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Tablet/Capsule" },
  { value: "02", label: "IV Fluid" },
  { value: "03", label: "Injection" },
];
