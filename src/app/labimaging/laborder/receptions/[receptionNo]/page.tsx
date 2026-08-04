import LabReceptionDetail from "@/components/labimaging/laborder/LabReceptionDetail";

/**
 * 검사 접수 단건 상세 화면
 * 경로: /labimaging/laborder/receptions/{receptionNo}
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-lg font-semibold text-slate-800">검사 접수 상세</h1>
      <LabReceptionDetail />
    </div>
  );
}
