import Link from "next/link";
import EquipmentList from "@/components/surgery/room/EquipmentList";
import EquipmentRegisterForm from "@/components/surgery/room/EquipmentRegisterForm";
import RoomList from "@/components/surgery/room/RoomList";
import RoomRegisterForm from "@/components/surgery/room/RoomRegisterForm";

/**
 * 수술실·수술장비 마스터 관리 (SL2-1)
 * 경로: /surgery/room — 사이드바 메뉴 "수술실/수술장비 관리" 가 가리키는 주소
 *
 * <p>메뉴 이름대로 둘을 한 화면에 모았다. 장비 등록 시 소속 수술실을 골라야 해서
 * 수술실을 먼저 만들어야 하는데, 화면이 나뉘어 있으면 오가야 한다.</p>
 *
 * <p>기존 {@code /surgery/room/list}·{@code /surgery/equipment/list} 는 그대로 둔다 —
 * 수정 화면에서 목록으로 돌아갈 때 쓰는 경로다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술실 · 수술장비 관리
      </h1>

      <section className="mb-12">
        <h2 className="mb-1 text-sm font-medium text-slate-700">수술실</h2>
        <p className="mb-4 text-xs text-slate-500">
          수술실 코드는 등록 후 변경할 수 없습니다. 사용을 멈출 때는 삭제하지 않고
          상태를 <b>04 폐쇄</b> 로 바꿉니다. <b>01 사용가능</b> 인 수술실만 수술 배정
          대상이 됩니다.
        </p>
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <RoomRegisterForm />
        </div>
        <RoomList />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">수술장비</h2>
        <p className="mb-4 text-xs text-slate-500">
          장비는 반드시 소속 수술실이 있어야 합니다. 수술실을 먼저 등록하세요.
        </p>
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <EquipmentRegisterForm />
        </div>
        <EquipmentList />
      </section>

      <p className="mt-10 text-xs text-slate-500">
        목록만 보려면{" "}
        <Link href="/surgery/room/list" className="text-sky-600 underline">
          수술실 목록
        </Link>{" "}
        ·{" "}
        <Link href="/surgery/equipment/list" className="text-sky-600 underline">
          장비 목록
        </Link>
      </p>
    </div>
  );
}
