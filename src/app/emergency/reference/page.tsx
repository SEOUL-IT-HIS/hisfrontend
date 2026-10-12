import ReferenceDocumentPanel from "@/components/emergency/reference/ReferenceDocumentPanel";

/**
 * 응급 참고 문서 (프로토콜·지침·서식 파일 라이브러리, 환자와 무관)
 * 경로: /emergency/reference
 * 사이드바의 Emergency > Reference Docs 메뉴로 들어온다(admin 메뉴관리에 이 경로가 등록돼 있다).
 */
export default function Page() {
  // 두 카드가 페이지 높이를 채우고, 드롭다운이 길어 스크롤바가 생겨도 폭이 변하지 않게 스크롤바 자리를 항상 둔다
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-6 [scrollbar-gutter:stable]">
      {/* 응급 참고 문서 */}
      <h1 className="text-lg font-semibold text-slate-800">Reference Documents</h1>
      <ReferenceDocumentPanel />
    </div>
  );
}
