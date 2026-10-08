import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissionListStatus,
  selectAdmissions,
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";

/**
 * 간호기록 목록용 — 기록의 입원 건(admissionId)으로 환자 이름을 찾아주는 훅
 * - 기록에는 admissionId만 있어서 입원 건 → 환자ID → 이름, 두 단계로 찾음
 * - 입원·환자 목록은 간호기록 홈이 이미 불러와 두므로, 이미 있으면 다시 요청하지 않음.
 *   단독 목록 페이지(/nursingrecord/…/list)로 열려서 비어 있을 때만 한 번 요청 (예전에는 목록 5개가 열릴 때마다 전체를 다시 받았음)
 * - patientNameOf 는 useCallback 으로 감싸서, 목록이 바뀌지 않는 한 같은 함수를 돌려줌 (표 열 정의 등이 불필요하게 다시 만들어지지 않게)
 */
export function usePatientNameByAdmission() {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const admissionListStatus = useSelector(selectAdmissionListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const patientListLoading = useSelector((state: RootState) => state.patient.listLoading);

  // 마운트될 때 한 번만 판단 — 결과가 진짜로 빈 목록이어도 계속 다시 요청하지 않게 의존성은 비워 둠
  useEffect(() => {
    if (admissions.length === 0 && !admissionListStatus.loading) dispatch(fetchAdmissionsRequest());
    if (patients.length === 0 && !patientListLoading) dispatch(fetchPatientListRequest({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patientIdByAdmissionId = useMemo(
    () => new Map(admissions.map((admission) => [admission.admissionId, admission.patientId])),
    [admissions],
  );
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );

  const patientNameOf = useCallback(
    (admissionId: string) => {
      const patientId = patientIdByAdmissionId.get(admissionId);
      return patientId ? patientNameById.get(patientId) ?? "Loading..." : "None";
    },
    [patientIdByAdmissionId, patientNameById],
  );

  return { patientNameOf };
}
