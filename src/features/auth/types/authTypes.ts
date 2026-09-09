/**
 * [인증 타입]
 * admin-service AuthDto / AuthRequestDto 와 맞춤
 */

/** API 공통 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 로그인 요청 — POST /api/admin/auth/login */
export type AuthLoginRequest = {
  loginId: string;
  password: string;
};

/** 로그인 / me 응답 사용자 */
export type AuthUser = {
  accountId: string;
  empId: string;
  loginId: string;
  empName: string | null;
  empNo: string | null;
  deptCode: string | null;
  accountStatus: string | null;

  /**
   * 이 사용자가 볼 수 있는 메뉴 코드들. 쉼표로 이어진 한 줄 문자열이다.
   * 예: "ADM_USER,ADM_PERMISSION,RCP_RECEPTION"
   *
   * 백엔드가 로그인할 때 역할(ROLE)에 걸린 ROLE_MENU 중 CAN_READ='Y' 인 메뉴만 모아 넣어준다.
   * 배열이 아니라 문자열인 이유: 세션이 Redis 에 저장되는데, 세션 객체에 List 를 넣으면
   * 되살릴 때(역직렬화) 허용 목록 문제가 생겨서 문자열로 합쳐 보낸다.
   *
   * 사이드바에서 이 값으로 메뉴를 거른다. AppShell.tsx 참고.
   */
  menuCodes: string | null;

  /** 이 사용자의 역할 코드들. menuCodes 와 같은 형식(쉼표 문자열). 아직 화면에서 쓰지 않는다. */
  roleCodes: string | null;
};
