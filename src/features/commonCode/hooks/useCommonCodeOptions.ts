"use client";

import { useEffect, useState } from "react";
import { fetchCommonCodeItemsByGroupCode } from "../api/commonCodeItemApi";

/** select 옵션 한 행 */
export interface CommonCodeOption {
  /** 저장/전송되는 값 (CommonCodeItem.codeValue, 예: "01") */
  value: string;
  /** 화면 표시 문구 (CommonCodeItem.codeName, 예: "외래") */
  label: string;
}

/**
 * admin 공통코드 그룹의 사용중(useYn='Y') 항목을 select 옵션으로 불러온다.
 *
 * - 컴포넌트에서 axios 를 직접 부르지 않고 features/commonCode/api 의 함수를 재사용한다. (가이드 10.3)
 * - next.config.ts rewrite 로 /api/commonCode* 는 admin-service 로 프록시되므로 별도 설정이 필요 없다.
 * - 조회 흐름(그룹목록 → groupId → 항목)은 fetchCommonCodeItemsByGroupCode 안에 들어 있다.
 *
 * @param groupCode admin 에 등록된 코드그룹ID (예: "RCPT_TYPE_CD")
 */
export function useCommonCodeOptions(groupCode: string) {
  const [options, setOptions] = useState<CommonCodeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const items = await fetchCommonCodeItemsByGroupCode(groupCode);
        setOptions(items.map((item) => ({ value: item.codeValue, label: item.codeName })));
      } catch (e) {
        setError(e instanceof Error ? e.message : "공통코드를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [groupCode]);

  return { options, loading, error };
}
