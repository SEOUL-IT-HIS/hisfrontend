import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

/**
 * 약제 업무(조제/불출/반납/출고/폐기)를 처리하는 사람 = 지금 로그인한 직원.
 * 예전에는 처리자가 "SYSTEM" 고정값으로 저장돼 누가 했는지 알 수 없었다. 로그인 정보가 없으면
 * actorId가 빈 문자열이라 화면의 처리 버튼이 비활성화된다.
 */
export function useActor(): { actorId: string; actorName: string } {
  const user = useSelector((state: RootState) => state.auth.user);
  return {
    actorId: user?.empId ?? "",
    actorName: user?.empName ?? user?.loginId ?? "",
  };
}
