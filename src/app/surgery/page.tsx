import PageHeader from "@/components/common/PageHeader";
import SurgeryHome from "@/components/surgery/SurgeryHome";

/**
 * 수술관리 서비스 진입 페이지
 *
 * <p>경로: /surgery (§8.1 app/{service}/page.tsx)</p>
 *
 * <p><b>메뉴 카드 나열을 걷어냈다</b>(2026-08-24) — 사이드바와 같은 목록을 한 번 더
 * 보여주고 있었다. 사이드바를 줄이면 이 화면만 옛 메뉴를 계속 들고 있어 어긋나기도 했다.
 * 지금은 배정 대기 건수와 금일 수술 현황을 보여준다.</p>
 *
 * <p>수술 요청 '등록' 화면이 없는 이유 — 일반 수술은 진료가, 응급 수술은 응급실이
 * 요청한다. 수술은 요청을 받아 배정·진행을 관리할 뿐 등록 화면을 갖지 않는다(§21.1).</p>
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <PageHeader
        title="수술관리"
        description="배정이 필요한 요청과 금일 수술 현황입니다."
      />
      <SurgeryHome />
    </div>
  );
}
