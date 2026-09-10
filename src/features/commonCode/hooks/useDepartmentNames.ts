"use client";

import { useEffect, useState } from "react";
import { fetchCommonCodeItemsByGroupCode } from "@/features/commonCode/api/commonCodeItemApi";

/**
 * 공통코드 그룹 DEPT_CD를 codeValue → codeName 맵으로 변환해주는 훅.
 * (useCommonCodeOptions는 select 옵션 형태(value/label)로 변환하지만, 목록 화면에서
 *  단순히 "코드값 → 이름 하나 찾기"만 하려면 이 맵 형태가 더 쓰기 편해서 별도로 둔다.)
 *
 * emp 화면(EmpList 등)에서도 같은 DEPT_CD를 쓰므로, 여러 화면에서 재사용 가능하다.
 */
export function useDepartmentNames() {
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const items = await fetchCommonCodeItemsByGroupCode("DEPT_CD");
        setNames(Object.fromEntries(items.map((item) => [item.codeValue, item.codeName])));
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "진료과 공통코드를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { names, loading, error };
}
