"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchVitalSignsRequest, selectVitalSignListStatus, selectVitalSigns } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import Link from "next/link";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";

const VitalSignList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const vitalSigns = useSelector(selectVitalSigns);
  const listStatus = useSelector(selectVitalSignListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);

  const patientIdByAdmissionId = useMemo(() => {
    return new Map(admissions.map((admission) => [admission.admissionId, admission.patientId]));
  }, [admissions]);

  const patientNameById = useMemo(() => {
    return new Map(patients.map((patient) => [patient.patientId, patient.patientName]));
  }, [patients]);
  
  useEffect(() => {
    dispatch(fetchVitalSignsRequest());
    dispatch(fetchAdmissionsRequest());
  dispatch(fetchPatientListRequest({}));
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
        <Link href="/inpatient/nursingrecord/vitalsign/create"> vital sign 등록</Link>
        <table>
          <thead>
            <tr>
              <th>환자명</th>
              <th>측정일시</th>
              <th>체온</th>
              <th>맥박</th>
              <th>호흡수</th>
              <th>혈압</th>
              <th>산소포화도</th>
              <th>측정자</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {vitalSigns.map((vitalSign) => (
              <tr key={vitalSign.vitalSignId}>
                <td>
                {(() => {
                const patientId = patientIdByAdmissionId.get(vitalSign.admissionId);
              return patientId ? (patientNameById.get(patientId) ?? "조회중...") : "없음";
              })()}
                </td>

                <td>{new Date(vitalSign.measuredAt).toLocaleString()}</td>
                <td>{vitalSign.temperature}</td>
                <td>{vitalSign.pulse}</td>
                <td>{vitalSign.respiration}</td>
                <td>{vitalSign.bpSystolic}/{vitalSign.bpDiastolic}</td>
                <td>{vitalSign.spo2}</td>
                <td>{vitalSign.recorderId}</td>
                <td>
                <Link href={`/inpatient/nursingrecord/vitalsign/${vitalSign.vitalSignId}`}>
                    {vitalSign.vitalSignId}
                </Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default VitalSignList;
