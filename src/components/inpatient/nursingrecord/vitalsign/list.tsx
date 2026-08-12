"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { fetchVitalSignsRequest, selectVitalSignListStatus, selectVitalSigns } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import Link from "next/link";

const VitalSignList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const vitalSigns = useSelector(selectVitalSigns);
  const listStatus = useSelector(selectVitalSignListStatus);

  useEffect(() => {
    dispatch(fetchVitalSignsRequest());
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
              <th>환자ID</th>
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
                <td>{vitalSign.admissionId}</td>
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
