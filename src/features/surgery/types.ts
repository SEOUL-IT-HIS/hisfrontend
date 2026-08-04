/**
 * 수술관리(SUR) 서비스 공통 타입
 *
 * <p>백엔드 surgery-service(kr.co.seoulit.surgery)의 공통 응답 포맷과 1:1로 맞춘다.
 * 스토리별 요청/응답 타입은 각 하위 폴더의 types.ts 에 둔다(labimaging 패턴과 동일).</p>
 */

/**
 * 공통 API 응답 포맷 (개발표준가이드 §11.3)
 *
 * <p>백엔드 global/common/ApiResponse.java 와 필드가 1:1 대응한다.
 * code: HTTP status 또는 서비스 정의 코드 / message: SUCCESS 또는 메시지코드(SUR###) /
 * data: 실제 응답 데이터</p>
 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/**
 * 페이징 응답 (백엔드 global/common/PageResponse.java)
 *
 * <p>Spring Data 의 Page 를 그대로 내리면 pageable/sort 등 내부 메타가 노출되어
 * §11.3 의 "단순 객체" 형태와 어긋나므로, 백엔드가 필요한 필드만 담아 내려준다.</p>
 */
export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

/** 목록 조회 공통 쿼리 파라미터 (Spring Pageable) */
export type PageParams = {
  /** 0-base 페이지 번호 */
  page?: number;
  size?: number;
  /** Spring Data Sort 표기. 예: "roomName" 또는 "roomName,desc" */
  sort?: string;
};

/** 여부 플래그 — DB CHAR(1) 'Y'/'N' (§14.2) */
export type YnFlag = "Y" | "N";

/**
 * 코드성 컬럼(_cd)은 문자열로 둔다.
 *
 * <p>코드 카탈로그의 소유·검증은 admin-service 공통코드 소관이므로(§21.4),
 * 프론트에서 리터럴 유니온으로 좁히면 admin 이 코드를 추가할 때마다 프론트를 고쳐야 한다.</p>
 *
 * <p><b>표시명(한글) 변환</b>은 저장된 값을 쓰지 않고 공통코드 조회로 해결한다(§14.1).
 * 이미 구현된 모듈을 재사용한다 — 수술 전용으로 다시 만들지 않는다.</p>
 *
 * <pre>
 * import { fetchCommonCodeItemApi } from "@/features/commonCode/api/commonCodeItemApi";
 * const items = await fetchCommonCodeItemApi(groupId);   // codeValue → codeName
 * </pre>
 *
 * <p>수술에서 쓰는 코드그룹(OR_STATUS_CD, OR_EQUIP_STATUS_CD, EQUIP_INOUT_CD,
 * SURGERY_STATUS_CD, SURG_PROGRESS_CD, ANESTHESIA_TYPE_CD, ASA_CD 등)의 groupId 는
 * admin-service 에 등록된 값을 조회해 사용한다. 코드 추가·변경 요청도 admin 팀 소관이다.</p>
 */
export type CodeValue = string;
