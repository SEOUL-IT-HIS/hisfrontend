"use client";

import { Input } from "@/components/common";

/**
 * 담당자 입력칸 자리에 로그인 사용자 이름을 읽기 전용으로 보여준다. (5차 Phase 2)
 *
 * ⚠ 값을 입력받지 않는다. 기록되는 담당자는 서버가 로그인 세션으로 정한다.
 *   예전처럼 직원ID 를 손으로 적게 두면, 남의 ID 로 기록할 수 있는 칸처럼 보인다.
 *
 * ⚠ labimaging 전용 컴포넌트다. 공통(components/common)에 두지 않는다 — 공통 컴포넌트는 리더 관리 대상.
 *   FormField 라벨은 화면마다 다르므로(접수자/확정자/서명자…) 바깥에서 감싼다.
 */
type Props = {
  /** useLoginActor().actorName */
  actorName: string;
  signedIn: boolean;
  name?: string;
};

export default function LoginActorInput({ actorName, signedIn, name }: Props) {
  return (
    <>
      <Input
        name={name}
        value={signedIn ? actorName : "Not signed in"}
        readOnly
        disabled
        aria-readonly="true"
      />
      <span className="text-xs text-slate-400">
        {signedIn ? "Recorded as the signed-in user." : "Sign in to record this action."}
      </span>
    </>
  );
}
