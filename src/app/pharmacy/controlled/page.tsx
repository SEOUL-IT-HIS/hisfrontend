import { redirect } from "next/navigation";

/** 마약류 관리의 첫 화면은 기록 조회 — 입고/출고/폐기는 그 화면의 탭으로 이어서 처리한다. */
export default function Page() {
  redirect("/pharmacy/controlled/records");
}
