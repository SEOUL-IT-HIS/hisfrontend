export function calculateAdmissionDays(admissionDate: string): number {
  const admitted = new Date(admissionDate);
  const now = new Date();
  const diffMs = now.getTime() - admitted.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
