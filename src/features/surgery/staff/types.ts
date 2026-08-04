/**
 * 수술 화면에서 참조하는 직원(집도의·마취의·간호사) 타입
 *
 * <p><b>여기 두는 이유</b> — 직원 데이터는 admin-service 소유이고, 정식 모듈은 다른 팀이
 * feature/front-management/ih2-12-employee 브랜치에서 features/admin 으로 작업 중이다.
 * 그 모듈이 develop 에 머지되기 전에 features/admin 을 만들면 같은 경로에 파일이 두 벌
 * 생겨 충돌한다. 그래서 수술 화면이 쓰는 <b>조회 전용 최소 타입</b>만 수술 폴더 안에 둔다.</p>
 *
 * <p><b>머지 후 정리</b> — features/admin 이 develop 에 들어오면 이 폴더를 지우고
 * 그쪽 Employee 타입과 getEmployees 를 import 하도록 바꾼다. 필드명은 그 브랜치의
 * 정의를 그대로 따랐으므로 교체 시 화면 수정은 없다.</p>
 */

/** 공통코드 EMP_STATUS_CD (01=재직/02=휴직/03=퇴직) — 코드 해석은 admin 소관(§21.4) */
export type EmpStatus = string;

/**
 * 직원 (admin-service EMP)
 *
 * <p>수술 화면은 선택 목록에 필요한 필드만 쓴다. 이름은 표시용으로만 사용하고
 * 수술 서비스에 저장하지 않는다 — 저장하는 것은 식별자뿐이다(§14.1 스냅샷 금지).</p>
 */
export type Employee = {
  empId: number;
  empNo: string;
  name: string;
  /** 공통코드 EMP_STATUS_CD */
  empStatus: EmpStatus | null;
  /** 공통코드 DEPT_CD */
  deptCode: string | null;
};
