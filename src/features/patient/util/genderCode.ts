import type { GenderCd } from "../type/patientType";

const genderLabels: Record<GenderCd, string> = {
  "01": "남성",
  "02": "여성",
  "03": "미상",
  "04": "기타",
};

export function getGenderLabel(genderCd: GenderCd): string {
  return genderLabels[genderCd] ?? genderCd;
}