import apiClient from "@/lib/axios";

/**
 * 환자 일괄 조회 (patient-service)
 *
 * <p><b>환자명을 우리 DB 에 저장하지 않고 필요할 때마다 물어본다.</b> 복사해 두면
 * 개명했을 때 화면마다 다른 이름이 보인다(§14.1 스냅샷 금지 — 공통코드 이름을
 * admin 에서 읽는 것과 같은 원칙이다). SURGERY 테이블이 갖는 것은 patient_id 뿐이다.</p>
 *
 * <p><b>백엔드를 거치지 않고 프론트가 직접 부른다.</b> features/commonCode 가 admin 을
 * 직접 부르는 것과 같은 방식이다. 표시용 값이라, patient-service 가 죽어도 수술 업무
 * (목록·상태 전이·기록 작성)는 그대로 돌아가야 한다. 수술 백엔드에 끼워 넣으면
 * 환자 서비스 장애가 워크리스트 조회 실패로 번진다.</p>
 *
 * <p><b>labimaging 의 같은 함수를 import 하지 않고 여기 따로 둔 이유</b> —
 * 남의 서비스 feature 폴더에 의존하면 그쪽 사정으로 우리 화면이 깨진다(§21.1
 * 서비스 경계). 지금은 코드가 거의 같지만, 소유가 다르면 각자 갖는 것이 맞다.
 * 공용으로 뽑는다면 features/common 같은 중립 자리가 필요하고 그건 별건이다.</p>
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
 * 환자ID 목록으로 이름을 조회해 {@code { patientId: patientName }} 맵으로 돌려준다.
 *
 * <p><b>존재하지 않는 ID 는 응답에서 조용히 빠진다.</b> 그래서 호출한 쪽은
 * "맵에 없을 수 있다"를 전제로 써야 한다.</p>
 */
export async function fetchPatientNames(
  patientIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(patientIds.filter(Boolean))].slice(0, MAX_BATCH_SIZE);
  if (unique.length === 0) {
    return {};
  }

  const { data } = await apiClient.post<PatientBatchResponse>(
    PATIENT_BATCH_PATH,
    { patientIds: unique },
  );

  const names: Record<string, string> = {};
  for (const patient of data.data ?? []) {
    names[patient.patientId] = patient.patientName;
  }
  return names;
}
