"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import {
  fetchAdmissionsRequest,
  selectAdmissions,
  selectAdmissionListStatus,
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import DischargeRequestDetail from "@/components/inpatient/admissiondischarge/discharge/DischargeRequestDetail";

type DischargeTargetListProps = {
  /** 입퇴원관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const DischargeTargetList = ({ embedded = false }: DischargeTargetListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const admissions = useSelector(selectAdmissions);
  const listStatus = useSelector(selectAdmissionListStatus);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dischargeTargets = useMemo(
    () => admissions.filter((admission) => admission.status === "ADMITTED"),
    [admissions],
  );

  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );

  useEffect(() => {
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-slate-800">퇴원 대상 목록</h1>
          <p className="mt-1 text-sm text-slate-500">현재 입원중인 퇴원 처리 대상 환자 목록입니다.</p>
        </div>
      )}

      {listStatus.loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">입원ID</th>
                  <th className="whitespace-nowrap px-4 py-3">환자명</th>
                  <th className="whitespace-nowrap px-4 py-3">입원과ID</th>
                  <th className="whitespace-nowrap px-4 py-3">환자ID</th>
                  <th className="whitespace-nowrap px-4 py-3">입원날짜</th>
                  <th className="whitespace-nowrap px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dischargeTargets.map((admission) => (
                  <tr
                    key={admission.admissionId}
                    onClick={() => setSelectedId(admission.admissionId)}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedId === admission.admissionId ? "bg-sky-50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{admission.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {patientNameById.get(admission.patientId) ?? "조회중..."}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDeptId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.patientId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDate}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                        입원중
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dischargeTargets.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">퇴원 대상 환자가 없습니다.</p>
            )}
          </div>

          {selectedId && (
            <div className="w-[420px] shrink-0">
              <DischargeRequestDetail admissionId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DischargeTargetList;
