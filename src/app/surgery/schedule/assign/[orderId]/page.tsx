import SurgeryAssignForm from "@/components/surgery/schedule/SurgeryAssignForm";

type Props = { params: Promise<{ orderId: string }> };

/**
 * 배정 등록 화면 (오더 접수 00 → 수락 01)
 * 경로: /surgery/schedule/assign/[orderId] (§8.1 update 계열)
 *
 * <p><b>수술 식별자가 아니라 오더 식별자를 받는다</b>(2026-08-13) — 수술은 배정이
 * 끝나야 만들어지므로, 이 화면에 들어오는 시점에는 아직 수술이 존재하지 않는다.
 * 수술실이 정해지는 순간 오더가 수락되고 그때 수술이 생긴다.</p>
 */
export default async function Page({ params }: Props) {
  const { orderId } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">배정 등록</h1>
      <SurgeryAssignForm orderId={orderId} />
    </div>
  );
}
