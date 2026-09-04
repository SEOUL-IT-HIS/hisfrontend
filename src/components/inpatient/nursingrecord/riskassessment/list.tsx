"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchRiskAssessmentsRequest, selectRiskAssessments, selectRiskAssessmentListStatus } from "@/features/inpatient/nursingrecord/riskassessment/slice";

const RISK_BADGE: Record<string, string> = {
  HIGH: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const RISK_LABEL: Record<string, string> = {
  HIGH: "High Risk",
  MEDIUM: "Medium Risk",
  LOW: "Low Risk",
};

type RiskAssessmentListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const RiskAssessmentList = ({ embedded = false }: RiskAssessmentListProps = {}) => {
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
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Patient Risk Assessment List</h1>
            <p className="mt-1 text-sm text-slate-500">Risk assessment records by patient.</p>
          </div>
        )}
        <Link
          href="/inpatient/nursingrecord/riskassessment/create"
          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Register Assessment
        </Link>
      </div>

      {listStatus.loading && <p className="text-sm text-slate-500">Loading...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Patient Name</th>
                <th className="whitespace-nowrap px-4 py-3">Risk Assessment ID</th>
                <th className="whitespace-nowrap px-4 py-3">Admission ID</th>
                <th className="whitespace-nowrap px-4 py-3">Assessment Type Code</th>
                <th className="whitespace-nowrap px-4 py-3">Assessment Score</th>
                <th className="whitespace-nowrap px-4 py-3">Risk Level</th>
                <th className="whitespace-nowrap px-4 py-3">Assessment Date</th>
                <th className="whitespace-nowrap px-4 py-3">Assessor ID</th>
                <th className="whitespace-nowrap px-4 py-3">Created At</th>
                <th className="whitespace-nowrap px-4 py-3">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskAssessments.map((riskAssessment) => {
                const patientId = patientIdByAdmissionId.get(riskAssessment.admissionId);
                const patientName = patientId ? (patientNameById.get(patientId) ?? "Loading...") : "None";
                return (
                  <tr key={riskAssessment.patientRiskAssessmentId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      <Link
                        href={`/inpatient/nursingrecord/riskassessment/${riskAssessment.patientRiskAssessmentId}`}
                        className="text-sky-700 hover:underline"
                      >
                        {riskAssessment.patientRiskAssessmentId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{riskAssessment.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{riskAssessment.assessmentTypeCd}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{riskAssessment.score}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          RISK_BADGE[riskAssessment.riskLevelCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {RISK_LABEL[riskAssessment.riskLevelCd] ?? riskAssessment.riskLevelCd}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(riskAssessment.assessedAt).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{riskAssessment.assessorId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(riskAssessment.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(riskAssessment.updatedAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {riskAssessments.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No risk assessment data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentList;
