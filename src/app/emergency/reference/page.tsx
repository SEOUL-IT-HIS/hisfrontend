import Link from "next/link";
import ReferenceDocumentPanel from "@/components/emergency/reference/ReferenceDocumentPanel";

/**
 * 응급 참고 문서 (프로토콜·지침·서식 파일 라이브러리, 환자와 무관)
 * 경로: /emergency/reference
 * 응급 메인 화면의 "Reference Documents" 버튼으로 들어온다. 사이드바 메뉴는 admin 메뉴관리에서
 * 이 경로를 등록하면 노출된다(등록 전에도 이 버튼과 주소로 쓸 수 있다).
 */
export default function Page() {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-3">
        {/* 응급 참고 문서 */}
        <h1 className="text-lg font-semibold text-slate-800">Reference Documents</h1>
        <Link
          href="/emergency"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          {/* 응급 화면으로 */}
          Back to Emergency
        </Link>
      </div>
      <ReferenceDocumentPanel />
    </div>
  );
}
