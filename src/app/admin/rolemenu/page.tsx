import RoleMenuList from "@/components/roleMenu/RoleMenuList";

/**
 * /admin/rolemenu 페이지 엔트리
 * - MENU.ADM_PERMISSION.menuUrl = /admin/rolemenu
 * - 실제 UI/로직은 RoleMenuList 에 있음 (얇은 page)
 */
export default function Page() {
  return <RoleMenuList />;
}
