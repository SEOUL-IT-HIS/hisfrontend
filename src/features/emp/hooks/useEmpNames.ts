"use client";

import { useEffect, useState } from "react";
import { fetchEmpApi } from "@/features/emp/api/empApi";

/**
 * empId → empName 맵을 만들어주는 공용 훅.
 *
 * patient-service의 usePatientNames와 달리, emp 쪽엔 배치조회 전용 API가 없어서
 * 전체 직원 목록(GET /api/emp/list)을 한 번 받아 프론트에서 맵으로 만든다.
 * 직원 수가 많아지면 /api/emp/batch 같은 전용 엔드포인트 도입을 검토할 것.
 *
 * ⚠ 이름은 표시 전용이다. admin-service가 응답을 못 줘도 화면(의사ID 등)은 계속 동작해야
 *   하므로 실패를 예외로 올리지 않고 error 문자열로만 남긴다.
 *
 * @example
 *   const { names } = useEmpNames();
 *   names[row.physicianId] ?? row.physicianId
 */
export function useEmpNames() {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const emps = await fetchEmpApi();
        setNames(Object.fromEntries(emps.map((emp) => [emp.empId, emp.empName])));
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "직원 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { names, loading, error };
}
