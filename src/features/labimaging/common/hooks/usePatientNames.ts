"use client";

import { useEffect, useState } from "react";
import { fetchPatientNames } from "@/features/labimaging/common/api";

/**
 * 환자ID 목록 → 환자명 맵을 불러온다.
 *
 * 검사 업무 화면 어디서나 같은 방식으로 이름을 붙이기 위한 공용 훅이다.
 * (features/commonCode 의 useCommonCodeOptions 와 같은 자리, 같은 모양)
 *
 * ⚠ 환자명은 표시 전용이다. 없다고 해서 업무가 막히면 안 된다.
 *   patient-service 가 죽어도 목록·등록·판정은 그대로 되고, 이름 자리만 비워 둔다.
 *   그래서 실패를 예외로 올리지 않고 error 문자열로만 남긴다.
 *
 * @example
 *   const { names } = usePatientNames(rows.map((r) => r.patientId));
 *   names[row.patientId] ?? "-"
 */
export function usePatientNames(patientIds: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * ⚠ 배열을 그대로 의존성에 넣으면 렌더마다 새 배열이라 무한 재조회가 된다.
   *   중복을 없애고 정렬해 문자열 하나로 만든 뒤, 그 값이 바뀔 때만 다시 부른다.
   *   순서만 다른 목록은 같은 요청으로 취급된다.
   */
  const key = [...new Set(patientIds.filter(Boolean))].sort().join(",");

  useEffect(() => {
    async function load() {
      if (!key) {
        setNames({});
        return;
      }
      setLoading(true);
      try {
        setNames(await fetchPatientNames(key.split(",")));
        setError("");
      } catch (e) {
        // 이름을 못 불러와도 화면은 계속 동작해야 한다. 이름 자리만 비워진다.
        setError(e instanceof Error ? e.message : "환자명을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [key]);

  return { names, loading, error };
}
