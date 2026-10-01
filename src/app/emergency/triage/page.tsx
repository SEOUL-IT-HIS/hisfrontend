import { redirect } from "next/navigation";

/**
 * 예전 경로 /emergency/triage — 화면이 /emergency 로 합쳐졌다.
 * 사이드바(admin 메뉴)에서 이 항목이 빠질 때까지 옛 링크가 깨지지 않도록 넘겨준다.
 */
export default function Page() {
  redirect("/emergency");
}
