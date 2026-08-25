"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchRiskAssessmentsRequest, selectRiskAssessments, selectRiskAssessmentListStatus } from "@/features/inpatient/nursingrecord/riskassessment/slice";

const RiskAssessmentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const riskAssessments = useSelector(selectRiskAssessments);
  const listStatus = useSelector(selectRiskAssessmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);

  useEffect(() => {
    dispatch(fetchRiskAssessmentsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
          <Link href="/inpatient/nursingrecord/riskassessment/create"> risk assessment 등록</Link>
          <table>
            <thead>
              <tr>
                <th>환자명</th>
                <th>위험도평가ID</th>
                <th>입원ID</th>
                <th>평가유형코드</th>
                <th>평가점수</th>
                <th>위험도등급코드</th>
                <th>평가일</th>
                <th>평가자ID</th>
                <th>생성일시</th>
                <th>수정일시</th>
              </tr>
            </thead>
            <tbody>
              {riskAssessments.map((riskAssessment) => {
                const patientId = patientIdByAdmissionId.get(riskAssessment.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "조회중...") : "없음";
                return (
                  <tr key={riskAssessment.patientRiskAssessmentId}>
                    <td>{patientName}</td>
                    <td>
                      <Link href={`/inpatient/nursingrecord/riskassessment/${riskAssessment.patientRiskAssessmentId}`}>
                        {riskAssessment.patientRiskAssessmentId}
                      </Link>
                    </td>
                    <td>{riskAssessment.admissionId}</td>
                    <td>{riskAssessment.assessmentTypeCd}</td>
                    <td>{riskAssessment.score}</td>
                    <td>{riskAssessment.riskLevelCd}</td>
                    <td>{new Date(riskAssessment.assessedAt).toLocaleDateString()}</td>
                    <td>{riskAssessment.assessorId}</td>
                    <td>{new Date(riskAssessment.createdAt).toLocaleString()}</td>
                    <td>{new Date(riskAssessment.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default RiskAssessmentList;
