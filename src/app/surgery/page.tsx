import PageHeader from "@/components/common/PageHeader";
import SurgeryHome from "@/components/surgery/SurgeryHome";

/**
 * 수술관리 서비스 진입 페이지
 *
 * <p>경로: /surgery (§8.1 app/{service}/page.tsx)</p>
 *
 * <p><b>메뉴 카드 나열을 걷어냈다</b> — 사이드바와 같은 목록을 한 번 더
 * 보여주고 있었다. 사이드바를 줄이면 이 화면만 옛 메뉴를 계속 들고 있어 어긋나기도 했다.
 * 지금은 배정 대기 건수와 금일 수술 현황을 보여준다.</p>
 *
 * <p><b>모니터링 화면({@code /surgery/monitoring})을 여기로 합쳤다.</b> 그 화면은
 * 금일 수술 목록 하나만 보여줬는데, 이 홈이 이미 같은 조회로 금일 건수를 세고 있었다.
 * 숫자와 그 숫자의 내역이 다른 화면에 나뉘어 있을 이유가 없다. 목록이 들어오면서
 * 폭도 넓혔다(max-w-4xl → 1800px) — 표가 8열이라 좁으면 가로로 밀린다.</p>
 *
 * <p>수술 요청 '등록' 화면이 없는 이유 — 일반 수술은 진료가, 응급 수술은 응급실이
 * 요청한다. 수술은 요청을 받아 배정·진행을 관리할 뿐 등록 화면을 갖지 않는다(§21.1).</p>
 */
export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 p-6">
      <PageHeader
        title="Surgery"
        description="Orders waiting for assignment and today's surgeries."
      />
      <SurgeryHome />
    </div>
  );
}
