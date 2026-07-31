import EquipmentUpdateForm from "@/components/surgery/room/EquipmentUpdateForm";

/**
 * 수술장비 정보 수정 화면 (SL2-31 / 초기값 바인딩 SL2-139)
 * 경로: /surgery/equipment/update/{equipmentId} (§8.1 update/[id])
 */
type Props = {
  params: Promise<{ equipmentId: string }>;
};

export default async function Page({ params }: Props) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술장비 정보 수정
      </h1>
      <EquipmentUpdateForm equipmentId={equipmentId} />
    </div>
  );
}
