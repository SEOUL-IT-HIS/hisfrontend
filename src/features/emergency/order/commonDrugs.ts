/**
 * 응급실에서 자주 쓰는 약 — 처방 등록 화면에서 골라서 빠르게 채우는 목록.
 *
 * 코드는 처방코어 약품 마스터(medications/search)의 약품 코드(ediCode)와 같다(타이레놀 EDI-TYLENOL-500, 케토로락 ER-KETO-30,
 * 온단세트론 ER-ONDA-4, 생리식염수 ER-NS-500). 약품 검색이 처방코어 장애로 실패해도 이 목록으로는 처방할 수 있다.
 * 코드를 바꿀 일이 생기면 이 파일의 itemCode 만 바꾸면 된다.
 * - 용량·횟수·일수는 처음 채워지는 값일 뿐이다. 의료진이 환자에 맞게 고쳐서 등록한다(진료 지침이 아니다).
 * - dosageFormCd 는 admin 공통코드 DOSAGE_FORM_CD: 01 Tablet/Capsule, 02 IV Fluid, 03 Injection.
 */
export interface CommonDrug {
  itemCode: string;
  itemName: string;
  /** 용도(목록에서 보여주는 짧은 설명) */
  purpose: string;
  dosage: string;
  dosageFormCd: string;
  frequency: string;
  durationDays: string;
}

export const COMMON_ER_DRUGS: ReadonlyArray<CommonDrug> = [
  { itemCode: "EDI-TYLENOL-500", itemName: "타이레놀정500mg", purpose: "Fever / pain", dosage: "1", dosageFormCd: "01", frequency: "TID", durationDays: "3" },
  { itemCode: "ER-NS-500", itemName: "생리식염수 0.9% 500mL", purpose: "IV fluid", dosage: "1", dosageFormCd: "02", frequency: "ONCE", durationDays: "1" },
  { itemCode: "ER-KETO-30", itemName: "케토로락주 30mg", purpose: "Analgesic injection", dosage: "1", dosageFormCd: "03", frequency: "ONCE", durationDays: "1" },
  { itemCode: "ER-ONDA-4", itemName: "온단세트론주 4mg", purpose: "Antiemetic injection", dosage: "1", dosageFormCd: "03", frequency: "ONCE", durationDays: "1" },
];

/** admin 공통코드 DOSAGE_FORM_CD 를 못 받을 때의 폴백 */
export const DOSAGE_FORM_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Tablet/Capsule" },
  { value: "02", label: "IV Fluid" },
  { value: "03", label: "Injection" },
];
