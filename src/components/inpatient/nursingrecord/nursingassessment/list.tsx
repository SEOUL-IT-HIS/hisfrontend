"use client";

import { useEffect, useMemo } from "react";
import { MENTAL_STATUS_OPTIONS, YN_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchNursingAssessmentsRequest, selectNursingAssessments, selectNursingAssessmentListStatus } from "@/features/inpatient/nursingrecord/nursingassessment/slice";

type NursingAssessmentListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
  /** 퇴원 완료된 입원 건이면 true — 기록 조회만 하고 등록 버튼은 숨김 */
  readOnly?: boolean;
};

const NursingAssessmentList = ({ embedded = false, admissionId = null, readOnly = false }: NursingAssessmentListProps = {}) => {
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
  const dispatch = useDispatch<AppDispatch>();
  const nursingAssessments = useSelector(selectNursingAssessments);
  const listStatus = useSelector(selectNursingAssessmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  // 지금은 백엔드가 전체 목록만 주므로 프론트에서 admissionId로 걸러냄 (백엔드에 입원 건별 조회 API가 생기면 이 filter는 제거)
  const visibleNursingAssessments = useMemo(
    () => (admissionId ? nursingAssessments.filter((nursingAssessment) => nursingAssessment.admissionId === admissionId) : nursingAssessments),
    [nursingAssessments, admissionId],
  );

  useEffect(() => {
    dispatch(fetchNursingAssessmentsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Patient Nursing Assessment List</h1>
            <p className="mt-1 text-sm text-slate-500">Nursing assessment records by patient.</p>
          </div>
        )}
        {!readOnly && (
          <Link
            href={`/inpatient/nursingrecord/nursingassessment/create${admissionId ? `?admissionId=${admissionId}` : ""}`}
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Register Assessment
          </Link>
        )}
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">Loading...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Patient Name</th>
                <th className="whitespace-nowrap px-4 py-3">Nursing Assessment ID</th>
                <th className="whitespace-nowrap px-4 py-3">Admission ID</th>
                <th className="whitespace-nowrap px-4 py-3">Allergy Yn</th>
                <th className="whitespace-nowrap px-4 py-3">Allergy Detail</th>
                <th className="whitespace-nowrap px-4 py-3">Past Medical History</th>
                <th className="whitespace-nowrap px-4 py-3">Mental Status Code</th>
                <th className="whitespace-nowrap px-4 py-3">Assessed At</th>
                <th className="whitespace-nowrap px-4 py-3">Assessor ID</th>
                <th className="whitespace-nowrap px-4 py-3">Created At</th>
                <th className="whitespace-nowrap px-4 py-3">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleNursingAssessments.map((nursingAssessment) => {
                const patientId = patientIdByAdmissionId.get(nursingAssessment.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "Loading...") : "None";
                return (
                  <tr key={nursingAssessment.nursingAssessmentId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <Link
                        href={`/inpatient/nursingrecord/nursingassessment/${nursingAssessment.nursingAssessmentId}`}
                        className="text-sky-700 hover:underline"
                      >
                        {nursingAssessment.nursingAssessmentId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{nursingAssessment.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{codeLabel(YN_OPTIONS, nursingAssessment.allergyYn)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{nursingAssessment.allergyDetail}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{nursingAssessment.pastMedicalHistory}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{codeLabel(MENTAL_STATUS_OPTIONS, nursingAssessment.mentalStatusCd)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(nursingAssessment.assessedAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{nursingAssessment.assessorId ? nurseNameById.get(nursingAssessment.assessorId) ?? nursingAssessment.assessorId : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(nursingAssessment.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(nursingAssessment.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleNursingAssessments.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No nursing assessment data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NursingAssessmentList;
