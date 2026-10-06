import { notFound } from "next/navigation";
import PatientDetailForm from "@/components/patient/PatientDetailForm";

type PatientDetailPageProps = {
  params: Promise<{
    patientId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  const [{ patientId }, query] = await Promise.all([params, searchParams]);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(patientId)) {
    notFound();
  }

  return (
    <PatientDetailForm
      patientId={patientId}
      returnTo={typeof query.returnTo === "string" ? query.returnTo : undefined}
    />
  );
}
