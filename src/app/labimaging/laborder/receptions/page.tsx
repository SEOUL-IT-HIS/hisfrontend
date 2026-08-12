import PageHeader from "@/components/common/PageHeader";
import LabReceptionListForm from "@/components/labimaging/laborder/LabReceptionListForm";

/**
 * 검사 접수 목록 화면 — 일정 등록/재조정 대상 선택
 * 경로: /labimaging/laborder/receptions
 *
 * 목록은 "일정 미등록 / 일정 등록됨 / 전체" 필터로 나눠 본다.
 * (미등록만 보이던 시절에는 일정 재조정 화면으로 갈 경로가 없었다)
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 p-6">
      <PageHeader
        title="검사 접수 목록"
        description="일정을 등록하거나 이미 잡힌 일정을 재조정할 접수를 고릅니다."
      />
      <LabReceptionListForm />
    </div>
  );
}
