import { redirect } from "next/navigation";

/**
 * /admin/emp → 사이드바 메뉴 URL(/admin/user) 로 통일
 */
export default function Page() {
  redirect("/admin/user");
}
