import type { GenderCd } from "../type/patientType";

const genderLabels: Record<GenderCd, string> = {
  "01": "Male",
  "02": "Female",
  "03": "Unknown",
  "04": "Other",
};

export function getGenderLabel(genderCd: GenderCd): string {
  return genderLabels[genderCd] ?? genderCd;
}
