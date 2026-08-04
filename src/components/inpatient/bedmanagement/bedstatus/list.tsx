"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import Link from "next/link";
import BedAssignmentDetail from "../bedassignment/detail";
import { fetchBedRequest, selectBed, selectBedListStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";

const BedStatusList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBed);
  const listStatus = useSelector(selectBedListStatus);

  const items=[
    {id:1, name: 'EMPTY', description: '빈 병상'},
    {id:2, name: 'OCCUPIED', description: '사용중인 병상'},
    {id:3, name: 'RESERVED', description: '예약된 병상'},
    {id:4, name: 'MAINTENANCE', description: '유지보수 중인 병상'},
  ];
  const [searchStatus, setSearchStatus] = React.useState<string>('');
  const filteredBeds = useMemo(() => {
  // searchStatus가 빈 문자열이면 bedAssignments 그대로 return
  if (!searchStatus) {
    return bedAssignments;
  }
  // 아니면 bedAssignments.filter(...)로 bedStatus 일치하는 것만 return
  return bedAssignments.filter(bed => bed.bedStatus === searchStatus);
}, [bedAssignments, searchStatus]);

  useEffect(() => {
    dispatch(fetchBedRequest());
  }, [dispatch]);

  return (
    <div>
      {listStatus.loading && <p>로딩중...</p>}
      {listStatus.error && <p>{listStatus.error}</p>}
      {!listStatus.loading && !listStatus.error && (
        <>
        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
      <option value="">전체</option>
        {items.map((item) => (
        <option key={item.id} value={item.name}>
          {item.description}
        </option>
        ))}
</select>
        <Link href="/inpatient/bedmanagement/bedassignment/create">배정 등록</Link>
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
            {filteredBeds.map((bed) => (
              <tr key={bed.bedId}>
                <td>
                <Link href={`/inpatient/bedmanagement/bedstatus/${bed.bedId}`}>
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
