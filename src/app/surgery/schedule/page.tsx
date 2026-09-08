import Link from "next/link";
import SurgeryAssignmentBoard from "@/components/surgery/schedule/SurgeryAssignmentBoard";

/**
 * 수술 배정 관리 (SL2-2)
 * 경로: /surgery/schedule — 사이드바 메뉴가 가리키는 주소
 *
 * <p>수술 요청은 진료·응급실이 보낸다(§21.1). 이 화면에는 등록 폼이 없고,
 * 들어온 요청을 배정하고 조정하는 것까지가 수술의 몫이다.</p>
 *
 * <p><b>구조를 수술 업무 화면에 맞췄다</b> — 목록만 있고 배정하려면
 * 상세로 페이지를 옮겨야 했다. 이제 좌측 목록·우측 배정의 마스터-디테일이다.
 * 상태 흐름 설명도 걷어냈다 — 시작·종료·취소가 수술 업무로 넘어가면서
 * 이 화면에서 일어나지 않는 일을 설명하고 있었다.</p>
 */
export default function Page() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1800px] flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Surgery assignment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Surgeries created from approved orders. The assignment itself is
            fixed at approval time and shown read-only here.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/surgery/schedule/requests"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-sky-400 hover:text-sky-600"
          >
            Pending orders
          </Link>
          <Link
            href="/surgery/worklist"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-sky-400 hover:text-sky-600"
          >
            Surgery worklist
          </Link>
        </div>
      </div>

      <SurgeryAssignmentBoard />
    </div>
  );
}
