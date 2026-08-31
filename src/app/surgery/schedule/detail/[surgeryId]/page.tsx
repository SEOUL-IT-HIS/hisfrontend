import PageHeader from "@/components/common/PageHeader";
import SurgeryScheduleDetail from "@/components/surgery/schedule/SurgeryScheduleDetail";

/**
 * 수술 배정·일정 상세
 * 경로: /surgery/schedule/detail/{surgeryId} (§8.1 detail/[id])
 *
 * <p><b>기록 화면에서 배정 화면으로 바꿨다</b> — 여기는
 * {@code /surgery/schedule} 아래, 즉 진료·응급이 올린 요청을 받아 배정하고 일정을
 * 관리하는 영역이다. 그런데 동의서·마취기록·수술기록지를 보여주고 있어서, 일정
 * 목록에서 수술을 누르면 엉뚱하게 기록 작성 화면이 나왔다. 게다가 그 패널 셋은
 * {@code /surgery/worklist} 가 이미 보여주고 있었다.</p>
 *
 * <p>이제 배정(수술실·집도의·마취의·간호사)·상태 전이·변경 이력을 다룬다.
 * 기록은 워크리스트로 가는 링크만 둔다.</p>
 *
 * <p>Next 15+ 에서 params 는 Promise 라 await 해서 꺼낸다.</p>
 */
type Props = {
  params: Promise<{ surgeryId: string }>;
};

export default async function Page({ params }: Props) {
  const { surgeryId } = await params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <PageHeader
        title="배정 상세"
        description="수술실·집도의·마취의·간호사를 배정합니다. 예약 상태에서만 바꿀 수 있습니다."
      />
      <SurgeryScheduleDetail surgeryId={surgeryId} />
    </div>
  );
}
