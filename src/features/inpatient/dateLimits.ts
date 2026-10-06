import { useSyncExternalStore } from "react";

/**
 * 입원 화면 datetime-local 입력의 min/max 값 ("YYYY-MM-DDTHH:mm", 브라우저 로컬 시간 기준)
 * - 서버 검증(inpatient-service common.util.DateRules)과 같은 기준
 * - 화면은 "날짜" 단위로만 막고, 시각까지의 정밀한 검증(미래 시각 등)은 서버가 함
 *   (현재 시각을 max로 두면 화면을 띄워 둔 채 시간이 지날 때 실제 현재 시각을 입력할 수 없게 됨)
 * - 서버 렌더에서는 undefined — 서버(UTC)와 브라우저(KST)의 "오늘"이 달라 생기는 hydration 불일치 방지
 */

// 병상예약의 입원 예정일은 오늘부터 최대 30일 후까지
export const MAX_RESERVATION_DAYS = 30;

const pad = (n: number) => String(n).padStart(2, "0");

const formatDay = (daysFromToday: number, time: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${time}`;
};

// 구독할 외부 변화가 없으므로 아무것도 하지 않음 (useSyncExternalStore용)
const noopSubscribe = () => () => {};

/** 오늘(+n일) 00:00 — min 값 */
export const useDayStart = (daysFromToday = 0) =>
    useSyncExternalStore(noopSubscribe, () => formatDay(daysFromToday, "00:00"), () => undefined);

/** 오늘(+n일) 23:59 — max 값 */
export const useDayEnd = (daysFromToday = 0) =>
    useSyncExternalStore(noopSubscribe, () => formatDay(daysFromToday, "23:59"), () => undefined);

/** 지금 시각 ("YYYY-MM-DDTHH:mm", 브라우저 로컬 시간) — datetime-local 입력값과 같은 형식 */
export const nowLocalInput = () => {
    const d = new Date();
    return `${formatDay(0, "")}${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * 등록 폼의 기록 시각 기본값(지금) — 서버 렌더에서는 undefined (hydration 불일치 방지)
 * - 폼은 이 값이 처음 생겼을 때 한 번만 채움 (렌더링 중 비교 방식, 각 폼 참고)
 */
export const useNowInput = () => useSyncExternalStore(noopSubscribe, nowLocalInput, () => undefined);

/**
 * 제출 직전 "미래 시각" 확인 — 서버(DateRules.isFuture)와 같은 기준
 * - max 속성을 현재 시각으로 두면 화면을 띄워 둔 채 시간이 지날 때 실제 현재 시각을 못 넣으므로,
 *   비교는 화면을 연 시각이 아니라 "제출하는 순간"의 현재 시각으로 함
 * - 서버에서 받은 값은 초까지 붙어 있을 수 있어서("…T10:20:00") 분 단위로 잘라 비교
 * - 문제없으면 null, 미래면 화면에 보여줄 문구
 */
export const futureTimeError = (value: string, label: string) =>
    value && value.slice(0, 16) > nowLocalInput() ? `${label} cannot be later than the current time.` : null;

/** 서버 날짜 문자열을 목록 표시용으로 — "2026-10-01T09:54:29.288676" → "2026-10-01 09:54", 없으면 "-" */
export const formatDateTime = (value: string | null | undefined) => (value ? value.replace("T", " ").slice(0, 16) : "-");
