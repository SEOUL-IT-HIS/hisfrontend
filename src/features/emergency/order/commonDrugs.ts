/**
 * 응급실에서 자주 쓰는 약 — 처방 등록 화면에서 골라서 빠르게 채우는 목록.
 *
 * 약품 검색(처방코어 medications/search)이 약제 서비스 부재로 동작하지 않아 만든 임시 목록이다.
 * - 타이레놀정500mg 의 코드(195700020)는 입원 처방 화면의 예시에 쓰이는 실제 약품 코드다. 나머지는 약품 마스터의 코드가 아니라
 *   응급에서 정한 견본 코드(ER- 로 시작)다. 처방코어는 약품 코드를 검증하지 않고 저장한다.
 *   실제 보험 코드(EDI)를 쓰려면 이 파일의 itemCode 만 바꾸면 된다.
 * - 약제 서비스에는 지금 타이레놀정500mg 정도만 있다고 한다. 약제 서비스가 빠져 있는 동안은 처방 등록과 투약 기록에만 쓰므로 나머지도 동작한다.
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
  { itemCode: "195700020", itemName: "타이레놀정500mg", purpose: "Fever / pain", dosage: "1", dosageFormCd: "01", frequency: "TID", durationDays: "3" },
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
