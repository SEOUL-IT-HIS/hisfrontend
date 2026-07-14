/**
 * Sidebar Menu (개발표준가이드 5.7 / 7장 menu.ts)
 * 서비스 목록은 3.2 서비스 브랜치 표를 기준으로 한다.
 */

export type SidebarMenuItem = {
  /** 서비스 코드 (UPPER 3자리) — 가이드 3.2 / 13장 */
  serviceCode: "PAT" | "RCP" | "BIL" | "OPD" | "EMG" | "IPT" | "LAB" | "PHM" | "SUR" | "ADM";
  /** 폴더명(camelCase) — 가이드 3.2 */
  serviceKey:
    | "patient"
    | "reception"
    | "billing"
    | "outpatient"
    | "emergency"
    | "inpatient"
    | "labImaging"
    | "pharmacy"
    | "surgery"
    | "admin";
  /** 화면 표시명 */
  label: string;
  /** App Router 경로 (app/{service}) — 현재 저장소 폴더는 소문자 */
  href: string;
};

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  {
    serviceCode: "PAT",
    serviceKey: "patient",
    label: "환자",
    href: "/patient",
  },
  {
    serviceCode: "RCP",
    serviceKey: "reception",
    label: "접수",
    href: "/reception",
  },
  {
    serviceCode: "BIL",
    serviceKey: "billing",
    label: "수납/청구",
    href: "/billing",
  },
  {
    serviceCode: "OPD",
    serviceKey: "outpatient",
    label: "외래",
    href: "/outpatient",
  },
  {
    serviceCode: "EMG",
    serviceKey: "emergency",
    label: "응급",
    href: "/emergency",
  },
  {
    serviceCode: "IPT",
    serviceKey: "inpatient",
    label: "입원",
    href: "/inpatient",
  },
  {
    serviceCode: "LAB",
    serviceKey: "labImaging",
    label: "검사/영상",
    href: "/labimaging",
  },
  {
    serviceCode: "PHM",
    serviceKey: "pharmacy",
    label: "약국",
    href: "/pharmacy",
  },
  {
    serviceCode: "SUR",
    serviceKey: "surgery",
    label: "수술",
    href: "/surgery",
  },
  {
    serviceCode: "ADM",
    serviceKey: "admin",
    label: "관리자",
    href: "/admin",
  },
];
