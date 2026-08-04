import RoomList from "@/components/surgery/room/RoomList";
import RoomRegisterForm from "@/components/surgery/room/RoomRegisterForm";

/**
 * 수술실 관리 화면 (SL2-6 조회 / SL2-7 등록)
 * 경로: /surgery/room/list (§8.1 app/{service}/{story}/{pageType})
 *
 * <p>페이지는 진입점만 담당하고 조회·입력 처리는 client 컴포넌트에 위임한다(§12.2).</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">수술실 관리</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-slate-700">수술실 등록</h2>
        <RoomRegisterForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">수술실 목록</h2>
        <RoomList />
      </section>
    </div>
  );
}
