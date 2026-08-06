import { redirect } from "next/navigation";

/**
 * /admin/user → 실제 경로(/admin/emp) 로 통일
 */
export default function Page() {
  redirect("/admin/emp");
}
