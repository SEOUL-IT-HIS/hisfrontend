"use client";

import { useEffect, useRef } from "react";

/**
 * 목록을 주기적으로 다시 불러오는 훅.
 *
 * 응급이 오접수로 닫아서 접수가 자동 취소되는 것처럼, 이 화면 밖에서 일어난 변경을 새로고침 없이 보여주기 위한 것이다.
 * - 탭이 보이는 동안에만 갱신한다 (다른 탭에 있으면 건너뜀).
 * - 다른 탭에 있다가 돌아오면 바로 한 번 갱신한다.
 * - refresh 는 로딩 표시·오류 문구를 건드리지 않는 "조용한" 갱신이어야 한다.
 */
export function useAutoRefresh(refresh: () => void, intervalMs = 10_000) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") latest.current();
    };
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
}
