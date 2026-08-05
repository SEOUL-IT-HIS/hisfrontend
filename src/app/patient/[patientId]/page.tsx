import { notFound } from "next/navigation";
import PatientDetailForm from "@/components/patient/PatientDetailForm";

type PatientDetailPageProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  const { patientId: patientIdParam } = await params;
  const patientId = Number(patientIdParam);

  if (!Number.isSafeInteger(patientId) || patientId <= 0) {
    notFound();
  }

  return <PatientDetailForm patientId={patientId} />;
}