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
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(patientId)) {
    notFound();
  }

  return <PatientDetailForm patientId={patientId} />;
}
