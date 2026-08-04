import RoomUpdateForm from "@/components/surgery/room/RoomUpdateForm";

/**
 * 수술실 정보 수정 화면 (SL2-30 / 초기값 바인딩 SL2-115)
 * 경로: /surgery/room/update/{roomCode} (§8.1 update/[id])
 */
type Props = {
  params: Promise<{ roomCode: string }>;
};

export default async function Page({ params }: Props) {
  const { roomCode } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">
        수술실 정보 수정
      </h1>
      <RoomUpdateForm roomCode={roomCode} />
    </div>
  );
}
