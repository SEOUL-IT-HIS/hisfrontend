import SurgeryAssignForm from "@/components/surgery/schedule/SurgeryAssignForm";

type Props = { params: Promise<{ surgeryId: string }> };

/**
 * 수술 배정 화면 (요청접수 → 예약)
 * 경로: /surgery/schedule/assign/[surgeryId] (§8.1 update 계열)
 */
export default async function Page({ params }: Props) {
  const { surgeryId } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">수술 배정</h1>
      <SurgeryAssignForm surgeryId={surgeryId} />
    </div>
  );
}
