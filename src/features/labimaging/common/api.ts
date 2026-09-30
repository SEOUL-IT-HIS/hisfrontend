import apiClient from "@/lib/axios";

/**
 * 환자 일괄 조회 (patient-service)
 *
 * ⚠ 환자명을 우리 DB 에 저장하지 않고 필요할 때마다 물어본다.
 *   복사해두면 개명했을 때 화면마다 다른 이름이 보인다.
 *   (개발표준가이드 14.1 스냅샷 금지 — 공통코드 이름을 admin 에서 읽는 것과 같은 원칙)
 *
 * ⚠ 환자번호는 화면·DTO 어디에서도 쓰지 않기로 했다. (2026-08-25 결정)
 *   전체 MSA 에서 활용 방식이 정해질 때까지 보류다.
 *   그래서 화면에서 환자를 알아보는 수단은 이름뿐이고, 이 조회가 그 유일한 경로다.
 *
 * ⚠ 백엔드를 거치지 않고 프론트가 직접 부른다.
 *   - features/commonCode 가 admin 을 직접 부르는 것과 같은 방식이다
 *   - 표시용 값이라, patient-service 가 죽어도 검사 업무(목록·등록·판정)는 그대로 돌아가야 한다.
 *     검사 백엔드에 끼워 넣으면 환자서비스 장애가 워크리스트 조회 실패로 번진다.
 */
const PATIENT_BATCH_PATH = "/api/patient/batch";

/** patient-service 응답 1건. 필요한 것만 적는다. */
type PatientBatchItem = {
  patientId: string;
  patientName: string;
};

type PatientBatchResponse = {
  code: number;
  message: string;
  data: PatientBatchItem[] | null;
};

/** 서버가 한 번에 받는 최대 건수. 초과분은 잘라 보낸다. (swagger maxItems) */
const MAX_BATCH_SIZE = 100;

/**
 * 환자ID 목록으로 이름을 조회해 { patientId: patientName } 맵으로 돌려준다.
 *
 * ⚠ 존재하지 않는 ID 는 응답에서 조용히 빠진다. (3건 요청 → 2건 반환을 실제로 확인)
 *   그래서 호출한 쪽은 "맵에 없을 수 있다"를 전제로 써야 한다.
 */
export async function fetchPatientNames(
  patientIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(patientIds.filter(Boolean))].slice(0, MAX_BATCH_SIZE);
  if (unique.length === 0) {
    return {};
  }

  const { data } = await apiClient.post<PatientBatchResponse>(PATIENT_BATCH_PATH, {
    patientIds: unique,
  });

  const names: Record<string, string> = {};
  for (const patient of data.data ?? []) {
    names[patient.patientId] = patient.patientName;
  }
  return names;
}
