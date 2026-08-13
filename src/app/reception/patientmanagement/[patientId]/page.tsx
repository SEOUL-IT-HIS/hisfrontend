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
  const { patientId } = await params;

  if (!patientId) {
    notFound();
  }

  return <PatientDetailForm patientId={patientId} />;
}