"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

/**
 * 로그인 사용자를 "담당자"로 쓰기 위한 값. (5차 Phase 2, 후속조치 #7)
 *
 * 검사·영상 화면의 담당자ID 입력칸(접수자·채취자·판정자·입력자·확정자·서명자·업로더·확인자)은
 * 더 이상 손으로 적지 않는다. 로그인 사용자의 empId 를 보내고, 화면에는 이름만 읽기 전용으로 보여준다.
 *
 * ⚠ 서버도 세션의 empId 로 기록하고 요청값은 무시한다(lab-imaging ActorIdResolver).
 *   그런데도 empId 를 보내는 이유 — 세션 연동이 안 되는 환경(개발 PC 단독 실행 등)에서는 서버가
 *   요청값을 대신 쓰는 과도기 설정(D2)이라, 비워 보내면 등록이 막힌다.
 *
 * ⚠ features/auth 는 읽기만 한다(수정 권한 제한). 이 프로젝트는 auth selector 를 따로 export 하지 않고
 *   컴포넌트에서 state.auth.user 를 바로 읽는 관례라 그대로 따른다. (AppFrame.tsx, Header.tsx 등)
 */
export function useLoginActor() {
  const user = useSelector((state: RootState) => state.auth.user);

  const actorId = user?.empId ?? "";
  // 이름이 없는 계정도 있어 empId 로 대신 보여준다.
  const actorName = user?.empName || actorId;

  return { actorId, actorName, signedIn: actorId !== "" };
}
