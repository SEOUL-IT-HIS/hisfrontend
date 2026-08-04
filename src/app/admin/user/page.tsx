import EmpList from "@/components/emp/EmpList";

/**
 * /admin/user 페이지 엔트리
 * - MENU.ADM_USER.menuUrl = /admin/user
 * - 실제 UI/로직은 EmpList 에 있음 (얇은 page)
 */
export default function Page() {
  return <EmpList />;
}
