/**
 * 로그아웃 후 클라이언트(Redux) 상태 초기화
 * - rootReducer 에서 state = undefined 로 전체 리셋
 */
export const LOGOUT_RESET = "auth/logoutReset" as const;

export type LogoutResetAction = {
  type: typeof LOGOUT_RESET;
};

export function logoutReset(): LogoutResetAction {
  return { type: LOGOUT_RESET };
}
