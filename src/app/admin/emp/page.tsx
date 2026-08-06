import EmpList from "@/components/emp/EmpList";

/**
 * /admin/emp 페이지 엔트리
 * - MENU.ADM_USER.menuUrl = /admin/emp
 * - 실제 UI/로직은 EmpList 에 있음 (얇은 page)
 */
export default function Page() {
  return <EmpList />;
}
