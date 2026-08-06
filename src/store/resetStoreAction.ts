/**
 * [스토어 전체 초기화 액션]
 * rootReducer(store 계층)가 스스로 소유하는 범용 신호 — 특정 feature를 몰라도 된다.
 * 이 액션이 dispatch되면 rootReducer가 전체 상태를 초기값으로 되돌린다.
 * 리셋이 필요한 feature(예: 로그아웃) 쪽에서 dispatch(resetStore())로 사용한다.
 */
export const RESET_STORE = "store/RESET_STORE";

export function resetStore() {
  return { type: RESET_STORE } as const;
}
