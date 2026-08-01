import EquipmentList from "@/components/surgery/room/EquipmentList";
import EquipmentRegisterForm from "@/components/surgery/room/EquipmentRegisterForm";

/**
 * 수술장비 관리 화면 (SL2-9 조회 / SL2-10 등록)
 * 경로: /surgery/equipment/list (§8.1)
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">수술장비 관리</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-slate-700">장비 등록</h2>
        <EquipmentRegisterForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">장비 목록</h2>
        <EquipmentList />
      </section>
    </div>
  );
}
