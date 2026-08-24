"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

/** select 옵션 한 행 */
export interface OutpatientCommonCodeOption {
  value: string;
  label: string;
}

/**
 * 외래(OPD) 화면에서 공통코드 select 옵션을 가져온다.
 * 앱 구동 시 saga.ts(watchOutpatientCommonCodeSaga)가 전체 그룹/항목을 한 번에 받아
 * outpatient.commonCode 에 캐싱해 두므로, 이 훅은 캐시만 읽고 API를 직접 호출하지 않는다.
 *
 * @param groupCode admin 에 등록된 코드그룹코드 (예: "RCPT_TYPE_CD")
 */
export function useOutpatientCommonCodeOptions(groupCode: string) {
  const items = useSelector(
    (state: RootState) => state.outpatient.commonCode.itemsByGroupCode[groupCode],
  );
  const status = useSelector((state: RootState) => state.outpatient.commonCode.status);
  const error = useSelector((state: RootState) => state.outpatient.commonCode.error);

  const options: OutpatientCommonCodeOption[] = (items ?? []).map((item) => ({
    value: item.codeValue,
    label: item.codeName,
  }));

  return {
    options,
    loading: status === "idle" || status === "loading",
    error: status === "error" ? (error ?? "공통코드를 불러오지 못했습니다.") : "",
  };
}
