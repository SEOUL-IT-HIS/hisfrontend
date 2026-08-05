import { redirect } from "next/navigation";

/**
 * 첫 진입 → 로그인 화면
 */
export default function Home() {
  redirect("/login");
}
