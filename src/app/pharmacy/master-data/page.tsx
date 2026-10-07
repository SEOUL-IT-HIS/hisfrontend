import { redirect } from "next/navigation";

/** 기준정보 관리의 첫 화면은 약품 등록 — 공급처/보관위치는 그 화면의 탭으로 이어서 처리한다. */
export default function Page() {
  redirect("/pharmacy/medication/register");
}
