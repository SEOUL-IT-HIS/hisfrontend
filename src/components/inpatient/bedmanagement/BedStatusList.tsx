"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import Link from "next/link";
import BedAssignmentDetail from "./BedassigmentDetail";
import { fetchBedRequest, selectBed, selectBedListStatus } from "@/features/inpatient/bedmanagement/bedSlice";

const BedStatusList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBed);
  const listStatus = useSelector(selectBedListStatus);

  useEffect(() => {
    dispatch(fetchBedRequest());
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
        <Link href="/inpatient/bedmanagement/create">배정 등록</Link>
        <table>
          <thead>
            <tr>
              <th>병상ID</th>
              <th>병실번호</th>
              <th>병상번호</th>
              <th>병상상태</th>
            </tr>
          </thead>
          <tbody>
            {bedAssignments.map((bed) => (
              <tr key={bed.bedId}>
                <td>
                <Link href={`/inpatient/bedmanagement/status/${bed.bedId}`}>
                    {bed.bedId}
                </Link>
                </td>
                <td>{bed.roomNo}</td>
                <td>{bed.bedNo}</td>
                <td>{bed.bedStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default BedStatusList;
