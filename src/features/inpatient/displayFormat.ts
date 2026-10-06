import { getGenderLabel } from "@/features/patient/util/genderCode";
import type { GenderCd } from "@/features/patient/type/patientType";

/**
 * 입원 화면 공통 표시 형식 — 내부 ID 대신 사람이 읽는 값으로 보여주기 위함
 */

/** 성별/나이 — "F / 34" (생년월일이 없으면 성별만, 둘 다 없으면 "-") */
export const formatSexAge = (genderCd?: GenderCd | null, birthDate?: string | null) => {
  const sex = genderCd ? getGenderLabel(genderCd).charAt(0) : null;
  let age: number | null = null;
  if (birthDate) {
    const birth = new Date(birthDate);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const beforeBirthday =
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
      if (beforeBirthday) age -= 1;
    }
  }
  if (sex && age !== null) return `${sex} / ${age}`;
  return sex ?? (age !== null ? `${age}` : "-");
};

/** 병상 — "BED-404A" → "Room 404 · Bed A" (형식이 다르면 원래 값) */
export const formatBedLabel = (bedId?: string | null) => {
  if (!bedId) return "-";
  const match = /^BED-(\d+)([A-Z])$/.exec(bedId);
  return match ? `Room ${match[1]} · Bed ${match[2]}` : bedId;
};
