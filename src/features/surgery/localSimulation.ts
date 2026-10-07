/**
 * 수술 전용 로컬 시뮬레이션 모드 (README "Local surgery simulation" 참고).
 * admin/patient-service 호출을 건너뛰고 결정론적 더미 데이터를 쓴다 —
 * 로그인 셀을 우회하므로 공유/운영 환경에서는 절대 켜면 안 된다.
 */
export const surgeryDemoMode = process.env.NEXT_PUBLIC_SURGERY_DEMO_MODE === "true";
