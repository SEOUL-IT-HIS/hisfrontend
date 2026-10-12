export function getPatientDisplayName(
  patientName: string | null | undefined,
  tempPatientNo?: number | null,
  tempPatientYn?: "Y" | "N",
): string {
  if (patientName?.trim()) return patientName;
  if (tempPatientYn === "Y" && tempPatientNo != null) {
    return String(tempPatientNo).padStart(6, "0");
  }
  return "";
}
