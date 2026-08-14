/**
 * emergency-service 가 서버 기동 시 admin-service 에서 전부 받아 캐싱해둔 공통코드.
 * (kr.co.seoulit.his.emergencyservice.commoncode.dto.AdminCommonCodeItemDto 미러링)
 */
export interface CommonCodeItem {
  codeId: number;
  groupId: number;
  codeValue: string;
  codeName: string;
  useYn: string;
}

/** GET /api/emergency/codes/common 응답 — 그룹코드별 항목 목록 */
export type CommonCodeByGroup = Record<string, CommonCodeItem[]>;

export interface CommonCodeState {
  byGroupCode: CommonCodeByGroup;
  loading: boolean;
  loaded: boolean;
  error: string;
}
