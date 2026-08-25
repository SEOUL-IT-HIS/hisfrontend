import AnesthesiaRecordPanel from "@/components/surgery/anesthesia/AnesthesiaRecordPanel";
import ConsentPanel from "@/components/surgery/consent/ConsentPanel";
import OperativeRecordPanel from "@/components/surgery/operativeRecord/OperativeRecordPanel";

/**
 * 수술 상세 화면 (동의서 SL2-42 / 마취기록 SL2-3 / 수술기록지 SL2-51)
 * 경로: /surgery/schedule/detail/{surgeryId} (§8.1 detail/[id])
 *
 * <p>동의서·마취기록·수술기록지는 특정 수술에 종속되므로 수술 상세 아래에 둔다.
 * Next 15+ 에서 params 는 Promise 라 await 해서 꺼낸다.</p>
 */
type Props = {
  params: Promise<{ surgeryId: string }>;
};

export default async function Page({ params }: Props) {
  const { surgeryId } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-800">수술 상세</h1>
      <p className="mb-6 text-xs text-slate-500">수술 ID {surgeryId}</p>

      {/* 동의서를 맨 위에 둔다 — 수술 시작 전 반드시 확인해야 하고, 미기록 시 백엔드가 시작을 막는다(SL2-217) */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-700">수술 동의서</h2>
        <ConsentPanel surgeryId={surgeryId} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-slate-700">마취기록</h2>
        <AnesthesiaRecordPanel surgeryId={surgeryId} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">수술기록지</h2>
        <OperativeRecordPanel surgeryId={surgeryId} />
      </section>
    </div>
  );
}
