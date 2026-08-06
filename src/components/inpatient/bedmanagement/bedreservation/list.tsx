"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchBedReservationsRequest,
  selectBedReservations,
  selectBedReservationListStatus,
} from "@/features/inpatient/bedmanagement/bedreservation/slice";
import Link from "next/link";

const BedReservationList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedReservations = useSelector(selectBedReservations);
  const listStatus = useSelector(selectBedReservationListStatus);

  useEffect(() => {
    dispatch(fetchBedReservationsRequest());
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
        <Link href="/inpatient/bedmanagement/bedreservation/create">예약 등록</Link>
        <table>
          <thead>
            <tr>
              <th>예약ID</th>
              <th>병상ID</th>
              <th>환자ID</th>
              <th>예약시각</th>
              <th>퇴원시각</th>
            </tr>
          </thead>
          <tbody>
            {bedReservations.map((bedReservation) => (
              <tr key={bedReservation.bedReservationId}>
                <td>
                <Link href={`/inpatient/bedmanagement/bedreservation/${bedReservation.bedReservationId}`}>
                    {bedReservation.bedReservationId}
                </Link>
                </td>
                <td>{bedReservation.bedId}</td>
                <td>{bedReservation.patientId}</td>
                <td>{bedReservation.reserveAt}</td>
                <td>{bedReservation.expectedAdmissionAt}</td>
                <td>{bedReservation.reservationStatusCd}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default BedReservationList;
