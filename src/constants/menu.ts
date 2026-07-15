/**
 * 업무영역 기준 메뉴 트리
 * - L0: 업무영역 (Sidebar 토글 그룹) — 원무 / 진료 / 진료지원 / 시스템
 * - L1: 기능 메뉴 (Sidebar children) — 실제 화면 진입점
 * - serviceCode: MSA 소유 서비스 메타 (UI 미표시, 권한·시드 연동용)
 * - app/{service} 경로·폴더는 MSA 경계 유지. 메뉴 IA만 업무 흐름으로 분리.
 */

export type ServiceCode =
  | "PAT"
  | "RCP"
  | "BIL"
  | "OPD"
  | "EMG"
  | "IPT"
  | "LAB"
  | "PHM"
  | "SUR"
  | "ADM";

export type WorkAreaKey = "frontOffice" | "clinical" | "ancillary" | "system";

export type MenuChild = {
  /** 메뉴 표시명 (DB menu_name 후보) */
  label: string;
  /** App Router 경로 */
  href: string;
  /** 소유 MSA 서비스 코드 */
  serviceCode: ServiceCode;
};

export type SidebarMenuItem = {
  /** 업무영역 키 */
  area: WorkAreaKey;
  /** L0 메뉴 표시명 */
  label: string;
  /** 업무영역 홈 경로 */
  href: string;
  /**
   * 기존 MSA 서비스 루트 경로.
   * 업무영역 홈이 아닌 /patient, /reception 등 진입 시 L0 매칭용.
   */
  serviceRoots: string[];
  /** L1 children — Sidebar 토글 하위 */
  children: MenuChild[];
};

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  {
    area: "frontOffice",
    label: "원무",
    href: "/frontoffice",
    serviceRoots: ["/patient", "/reception", "/billing"],
    children: [
      { label: "환자기본정보", href: "/patient/patientbasicinfo", serviceCode: "PAT" },
      { label: "환자안전정보", href: "/patient/patientsafetystatus", serviceCode: "PAT" },
      { label: "환자관리", href: "/reception/patientmanagement", serviceCode: "RCP" },
      { label: "접수관리", href: "/reception/receptionmanagement", serviceCode: "RCP" },
      { label: "예약관리", href: "/reception/appointmentmanagement", serviceCode: "RCP" },
      { label: "대기열관리", href: "/reception/queuemanagement", serviceCode: "RCP" },
      { label: "입원등록관리", href: "/reception/admissionregistrationmanagement", serviceCode: "RCP" },
      { label: "수납", href: "/billing/payment", serviceCode: "BIL" },
      { label: "청구", href: "/billing/claim", serviceCode: "BIL" },
      { label: "미수금", href: "/billing/outstanding", serviceCode: "BIL" },
    ],
  },
  {
    area: "clinical",
    label: "진료",
    href: "/clinical",
    serviceRoots: ["/outpatient", "/emergency", "/inpatient"],
    children: [
      { label: "외래진료", href: "/outpatient/chart", serviceCode: "OPD" },
      { label: "외래처방", href: "/outpatient/prescription", serviceCode: "OPD" },
      { label: "응급접수", href: "/emergency/reception", serviceCode: "EMG" },
      { label: "응급진료", href: "/emergency/chart", serviceCode: "EMG" },
      { label: "병동", href: "/inpatient/ward", serviceCode: "IPT" },
      { label: "입원환자", href: "/inpatient/patient", serviceCode: "IPT" },
      { label: "퇴원", href: "/inpatient/discharge", serviceCode: "IPT" },
    ],
  },
  {
    area: "ancillary",
    label: "진료지원",
    href: "/ancillary",
    serviceRoots: ["/labimaging", "/pharmacy", "/surgery"],
    children: [
      { label: "검체", href: "/labimaging/labspecimen", serviceCode: "LAB" },
      { label: "검사결과", href: "/labimaging/labresult", serviceCode: "LAB" },
      { label: "영상촬영", href: "/labimaging/imagingacquisition", serviceCode: "LAB" },
      { label: "판독", href: "/labimaging/imaginginterpretation", serviceCode: "LAB" },
      { label: "공통", href: "/labimaging/common", serviceCode: "LAB" },
      { label: "처방조제", href: "/pharmacy/dispense", serviceCode: "PHM" },
      { label: "약재고", href: "/pharmacy/inventory", serviceCode: "PHM" },
      { label: "수술스케줄", href: "/surgery/schedule", serviceCode: "SUR" },
      { label: "수술기록", href: "/surgery/record", serviceCode: "SUR" },
    ],
  },
  {
    area: "system",
    label: "시스템",
    href: "/system",
    serviceRoots: ["/admin"],
    children: [
      { label: "직원", href: "/admin/user", serviceCode: "ADM" },
      { label: "권한", href: "/admin/permission", serviceCode: "ADM" },
      { label: "공통코드", href: "/admin/commoncode", serviceCode: "ADM" },
      { label: "문서양식", href: "/admin/document", serviceCode: "ADM" },
      { label: "병원설정", href: "/admin/hospital", serviceCode: "ADM" },
    ],
  },
];

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 현재 경로에 해당하는 L0 업무영역 메뉴 */
export function findWorkAreaMenuByPath(pathname: string): SidebarMenuItem | undefined {
  const byAreaHome = SIDEBAR_MENU.find((item) => matchesPath(pathname, item.href));
  if (byAreaHome) return byAreaHome;

  const byChild = SIDEBAR_MENU.find((item) =>
    item.children.some((child) => matchesPath(pathname, child.href)),
  );
  if (byChild) return byChild;

  return SIDEBAR_MENU.find((item) =>
    item.serviceRoots.some((root) => matchesPath(pathname, root)),
  );
}

/** 현재 경로에 해당하는 L1 child */
export function findChildMenuByPath(pathname: string): MenuChild | undefined {
  const workArea = findWorkAreaMenuByPath(pathname);
  if (!workArea) return undefined;

  return workArea.children.find((child) => matchesPath(pathname, child.href));
}
