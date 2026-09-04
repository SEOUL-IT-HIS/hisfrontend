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
 * <p><b>목록 전용 화면을 없앴다</b> — {@code /surgery/room/list} 와
 * {@code /surgery/equipment/list} 가 이 화면과 같은 목록을 또 보여주고 있었다.
 * 이 화면이 이미 둘을 다 띄우면서 그쪽으로 링크까지 걸어 두어, 같은 목록을 세 군데서
 * 보게 되는 구조였다. 수정 화면이 돌아올 곳도 이제 여기다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[1800px] p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        Operating rooms &amp; equipment
      </h1>

      <section className="mb-12">
        <h2 className="mb-1 text-sm font-medium text-slate-700">Operating rooms</h2>
        <p className="mb-4 text-xs text-slate-500">
          A room code cannot be changed once registered. To take a room out of use,
          set its status to <b>04 Closed</b> rather than deleting it. Only rooms in
          <b>01 Available</b> can be assigned to a surgery.
        </p>
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <RoomRegisterForm />
        </div>
        <RoomList />
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-slate-700">Equipment</h2>
        <p className="mb-4 text-xs text-slate-500">
          Equipment must belong to an operating room. Register the room first.
        </p>
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <EquipmentRegisterForm />
        </div>
        <EquipmentList />
      </section>
    </div>
  );
}
