import type { GenderCd } from "../type/patientType";

const genderLabels: Record<GenderCd, string> = {
  "01": "남성",
  "02": "여성",
  "03": "기타",
  "04": "미상",
};

export function getGenderLabel(genderCd: GenderCd): string {
  return genderLabels[genderCd];
}

export function formatPatientDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 19);
}

export function normalizePhoneNo(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 11);
}

export function formatPhoneNo(value: string): string {
  const digits = normalizePhoneNo(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function getBirthDateFromResidentRegNo(
  residentRegNo: string,
): string | null {
  if (!/^\d{13}$/.test(residentRegNo)) return null;

  const yearPart = Number(residentRegNo.slice(0, 2));
  const month = Number(residentRegNo.slice(2, 4));
  const day = Number(residentRegNo.slice(4, 6));
  const centuryByTypeCode: Record<string, number> = {
    "1": 1900,
    "2": 1900,
    "3": 2000,
    "4": 2000,
    "5": 1900,
    "6": 1900,
    "7": 2000,
    "8": 2000,
  };
  const century = centuryByTypeCode[residentRegNo.charAt(6)];

  if (century === undefined) return null;

  const year = century + yearPart;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function validatePatientName(value: string): string | null {
  const length = value.trim().length;
  return length < 2 || length > 100
    ? "환자명은 2자 이상 100자 이하로 입력해 주세요."
    : null;
}

export function validateZipCode(value: string): string | null {
  return value && !/^\d{5}$/.test(value.trim())
    ? "우편번호는 숫자 5자리로 입력해 주세요."
    : null;
}

export function validatePhoneNo(value: string): string | null {
  const phoneNo = normalizePhoneNo(value);
  return phoneNo && !/^\d{9,11}$/.test(phoneNo)
    ? "연락처는 숫자 9~11자리로 입력해 주세요."
    : null;
}
