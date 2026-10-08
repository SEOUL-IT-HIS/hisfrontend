import { useSelector } from "react-redux";
import { selectDispositionByReceptionId } from "@/features/emergency/disposition/slice";
import { selectReceptionListItems } from "@/features/emergency/receptionList/slice";
import { formatDateTime } from "@/features/emergency/utils";

/** 서버가 허용하는 시계 차이(분) — 서버(DischargeProgress)와 같은 값 */
const TOLERANCE_MS = 5 * 60 * 1000;

/** 결정한 시각에 응급실을 떠난 것으로 보는 퇴실 유형: 01 귀가, 04 사망, 05 자의퇴원 (입원·전원은 병상·소견서가 나올 때까지 응급실에 있다) */
const LEAVES_AT_DECISION = ["01", "04", "05"];

/** 투약·CPR·동의 같은 "그때 있었던 일"의 시각이 가질 수 있는 범위 */
export type EventTimeLimits = {
  /** 접수 시각(서버가 준 문자열, 모르면 null) */
  receivedAt: string | null;
  /** 귀가·사망·자의퇴원으로 응급실을 떠난 시각(서버가 준 문자열, 아니면 null) */
  leftAt: string | null;
};

/** datetime-local 입력이 쓰는 형식(YYYY-MM-DDTHH:mm, 로컬 시각) */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 입력한 사건 시각이 범위를 벗어나면 그 이유(영문 문장), 괜찮거나 비어 있으면 "" */
export function eventTimeError(value: string, limits: EventTimeLimits): string {
  if (!value) return "";
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return "";
  if (at > Date.now() + TOLERANCE_MS) return "The time cannot be in the future.";
  if (limits.receivedAt && at < Math.floor(new Date(limits.receivedAt).getTime() / 60000) * 60000) {
    return `The time cannot be earlier than the reception time (${formatDateTime(limits.receivedAt)}).`;
  }
  if (limits.leftAt && at > new Date(limits.leftAt).getTime() + TOLERANCE_MS) {
    return `The time cannot be later than the discharge time (${formatDateTime(limits.leftAt)}).`;
  }
  return "";
}

/**
 * 이 접수에서 사건 시각이 가질 수 있는 범위(접수 시각 이후, 귀가·사망·자의퇴원이면 퇴실 결정 시각 이전).
 * 접수 시각은 환자 목록에서, 퇴실 결정은 퇴실 결정 조회 결과에서 읽는다(목록에 없으면 그 쪽 제한은 서버가 확인한다).
 */
export function useEventTimeLimits(receptionNo: string): EventTimeLimits {
  const receivedAtText = useSelector(selectReceptionListItems).find((item) => item.receptionId === receptionNo)?.receivedAt;
  const disposition = useSelector(selectDispositionByReceptionId(receptionNo));
  const leaves = !!disposition && LEAVES_AT_DECISION.includes(disposition.dispositionTypeCode);
  return {
    receivedAt: receivedAtText ?? null,
    leftAt: leaves && disposition?.decidedAt ? disposition.decidedAt : null,
  };
}

/** datetime-local 입력의 min / max (범위를 모르면 undefined) */
export function eventTimeBounds(limits: EventTimeLimits): { min?: string; max?: string } {
  const upper = limits.leftAt ? Math.min(Date.now(), new Date(limits.leftAt).getTime()) : Date.now();
  return {
    min: limits.receivedAt ? toLocalInputValue(new Date(limits.receivedAt)) : undefined,
    max: toLocalInputValue(new Date(upper)),
  };
}
