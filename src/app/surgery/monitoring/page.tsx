import { redirect } from "next/navigation";

/**
 * 수술 현황 모니터링 — <b>수술 관리 홈으로 합쳐졌다.</b>
 *
 * <p>이 화면은 금일 수술 목록 하나만 보여줬는데, 홈({@code /surgery})이 이미 같은
 * 조회로 금일 예약·진행중·완료 건수를 세고 있었다. 같은 데이터를 두 화면이 각자
 * 받아다 절반씩 보여주고 있었던 셈이라, 목록을 홈으로 옮기고 이 경로는 닫았다.</p>
 *
 * <p><b>파일을 지우지 않고 리다이렉트로 둔 이유</b> — admin-service 의 {@code MENU}
 * 테이블에 아직 {@code SUR_MONITORING} 이 남아 있다. 그 테이블은 admin 소유라
 * 우리가 지울 수 없고, 요청해서 지워질 때까지는 사이드바에 이 메뉴가 보인다.
 * 지금 파일을 없애면 그때까지 누를 때마다 404 가 뜬다.</p>
 *
 * <p>메뉴가 삭제되면(admin_수술메뉴_변경요청.md ③번) 이 파일도 함께 지운다.</p>
 */
export default function Page() {
  redirect("/surgery");
}
