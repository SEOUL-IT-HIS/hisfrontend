"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { loadAllCommonCodesRequest } from "./slice";

/** select 옵션 한 행 */
export interface OutpatientCommonCodeOption {
  value: string;
  label: string;
}

/**
 * 외래(OPD) 화면에서 공통코드 select 옵션을 가져온다.
 * admin-service API 는 로그인 이후에만 호출 가능하므로, 앱 구동 시 자동 적재하지 않고
 * 로그인 이후 외래 화면(이 훅을 쓰는 컴포넌트)에 처음 진입할 때, 캐시가 비어 있으면
 * (status === "idle") 이 훅이 직접 loadAllCommonCodesRequest 를 dispatch 해서 채운다.
 *
 * @param groupCode admin 에 등록된 코드그룹코드 (예: "RCPT_TYPE_CD")
 */
export function useOutpatientCommonCodeOptions(groupCode: string) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(
    (state: RootState) => state.outpatient.commonCode.itemsByGroupCode[groupCode],
  );
  const status = useSelector((state: RootState) => state.outpatient.commonCode.status);
  const error = useSelector((state: RootState) => state.outpatient.commonCode.error);

  useEffect(() => {
    if (status === "idle") {
      dispatch(loadAllCommonCodesRequest());
    }
  }, [status, dispatch]);

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
