/**
 * 수술 오더 타입 (SL2-36 진료 요청 / SL2-44 응급 요청 / SL2-225 목록 / SL2-226 반려)
 *
 * <p>백엔드 surgeryorder 패키지와 1:1 대응. 날짜 필드 구분에 주의한다(§14.2):
 * `_dt`(DATE)는 yyyy-MM-dd 문자열, `_at`(TIMESTAMP)은 ISO 일시 문자열이다.</p>
 *
 * <p><b>오더는 수술이 아니다</b> — 진료·응급실이 "이 환자 수술해 달라"고 보낸 요청이고,
 * 수술은 우리가 수술실을 배정해 받아들였을 때 만들어진다. 반려된 오더에는 수술이 없다.</p>
 */
import type { CodeValue, PageParams, YnFlag } from "@/features/surgery/types";

/**
 * 오더 상태 (SURGERY_ORDER.order_status_cd)
 *
 * <p>백엔드 {@code surgeryorder/type/OrderStatus.java} 와 짝을 이룬다.
 * 수술 상태(SURGERY_STATUS)와는 다른 축이다 — 이쪽은 요청을 받아들일지의 문제다.</p>
 */
export const ORDER_STATUS = {
  /** 접수 — 아직 수술실 담당자가 처리하지 않음 */
  RECEIVED: "00",
  /** 수락 — 수술실이 배정되어 수술이 만들어짐 */
  ACCEPTED: "01",
  /** 반려 — 사유를 남기고 되돌려보냄. 수술은 만들어지지 않음 */
  REJECTED: "02",
  /**
   * 취소 — 수락 후 수술이 취소되어 무산됨
   *
   * <p>반려(02)와 다르다. 반려는 우리가 받지 않은 요청이고, 취소는 받아서 수술까지
   * 만들었다가 무산된 요청이다. 합치면 "요청 반려율"에 수술실·환자 사정으로 무산된
   * 건이 섞인다.</p>
   *
   * <p>이 상태로 바꾸는 것은 서버다 — 수술을 취소하면 오더가 따라 바뀐다.
   * 프론트가 직접 이 상태로 보내는 API 는 없다.</p>
   */
  CANCELLED: "03",
} as const;

export type OrderStatusCode = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** 오더 응답 */
export type SurgeryOrder = {
  orderId: string;
  patientId: string;
  /** 내원 식별자 — 청구 연동(SL2-72)에 쓰인다. 안 보내면 null */
  visitId: string | null;
  surgeonId: string;
  /** 희망 수술일 yyyy-MM-dd. 확정일이 아니다 */
  requestedDt: string;
  emergencyYn: YnFlag;
  orderStatusCd: OrderStatusCode;
  /** 반려일 때만 값이 있다 */
  rejectReasonCd: CodeValue | null;
  /**
   * 취소 사유. 취소(03)일 때만 값이 있다.
   *
   * <p>SURGERY_ORDER 에는 이 컬럼이 없다 — 원본은 수술이 갖고 있고, 서버가 조회할 때
   * surgeryId 로 읽어 응답에만 채운다. 저장된 값이 아니므로 이걸 되돌려 보내도 소용없다.</p>
   */
  cancelReasonCd: CodeValue | null;
  surgeryTypeCd: CodeValue | null;
  surgeryName: string | null;
  /** 요청자 식별자. 로그인 세션이 없어 프론트가 보내야 채워진다 */
  orderedBy: string | null;
  /** 수락 시 만들어진 수술의 식별자. 접수·반려면 null */
  surgeryId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 오더 접수 요청 (SL2-36 / SL2-44)
 *
 * <p>{@code emergencyYn} 과 {@code orderStatusCd} 가 없는 것에 주목할 것 —
 * 응급 여부는 <b>어느 API 를 부르는지</b>가 정하고 상태는 서버가 정한다.
 * 본문에 실어 보내도 백엔드가 무시한다.</p>
 */
export type CreateSurgeryOrderRequest = {
  patientId: string;
  /** 청구 연동에 필요하다. 진료는 되도록 채워 보낸다 */
  visitId?: string | null;
  surgeonId: string;
  /** yyyy-MM-dd */
  requestedDt: string;
  surgeryTypeCd?: CodeValue | null;
  surgeryName?: string | null;
  orderedBy?: string | null;
};

/**
 * 배정 요청 (SL2-15)
 *
 * <p>행위는 '배정'이고 오더의 '수락'은 그 결과다. 수술실이 정해지는 순간 수술이
 * 만들어지고 오더가 수락(01)으로 바뀐다.</p>
 */
export type AssignSurgeryOrderRequest = {
  /** 필수. 실재하고 사용가능(01) 상태여야 한다 */
  roomCode: string;
  /** 확정 수술일. 비우면 오더의 희망일을 그대로 쓴다 */
  surgeryDt?: string;
  /**
   * 마취 시행 여부. 필수다.
   *
   * <p>Y 면 마취의도 함께 보내야 한다. N 은 마취과가 붙지 않는 시술이다 —
   * 단순 봉합, 표재성 종물 제거 같은 것들.</p>
   */
  anesthesiaYn: "Y" | "N";
  /** 마취의. {@code anesthesiaYn === "Y"} 일 때 필수 */
  anesthesiologistId?: string | null;
  /** 간호사. 필수다 — 마취 여부와 무관하게 수술에는 간호사가 붙는다 */
  nurseId: string;
};

/**
 * 반려 요청 (SL2-226)
 *
 * <p><b>사유는 필수다</b>. 예전에는 코드 그룹이 admin 에 없어 비워 보낼 수
 * 있었는데, 2026-08-25 에 등록해 그 예외가 사라졌다. 백엔드도 {@code @NotBlank} 다.</p>
 */
export type RejectSurgeryOrderRequest = {
  rejectReasonCd: CodeValue;
};

/** 오더 목록 검색·페이지 파라미터 (SL2-225) */
export type SurgeryOrderSearchParams = PageParams & {
  /** '00' 접수 / '01' 수락 / '02' 반려. 미지정이면 전체 */
  orderStatusCd?: OrderStatusCode;
  emergencyYn?: YnFlag;
  patientId?: string;
  /** 희망일 시작 yyyy-MM-dd */
  fromDt?: string;
  /** 희망일 종료 yyyy-MM-dd */
  toDt?: string;
};

/** 오더 화면 상태 */
export type SurgeryOrderState = {
  orders: SurgeryOrder[];
  /**
   * 마지막으로 조회할 때 쓴 검색 조건.
   *
   * <p>접수·배정·반려 뒤에 목록을 다시 읽는데, 그때 조건을 빼고 부르면 화면이
   * 갑자기 전체 목록으로 바뀐다(배정 대기만 보던 화면에 수락·반려 건이 끼어든다).
   * 조건을 여기 담아 두고 그대로 다시 쓴다.</p>
   */
  lastParams?: SurgeryOrderSearchParams;
  loading: boolean;
  saving: boolean;
  error: string;
};
