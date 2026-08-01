"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchSurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectSurgeries,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 일정 목록 (SL2-25)
 *
 * <p>환자명·집도의명은 표시하지 않고 식별자만 보여준다. 이름은 수술 서비스가 소유하지
 * 않는 데이터라 저장하지 않으며(§14.1), 표시하려면 환자·직원 서비스 API 를 별도로
 * 호출해야 한다(§21.9). 해당 연동은 타 팀과 스펙 협의 후 붙인다.</p>
 */
export default function ScheduleList() {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectSurgeries);
  const loading = useSelector(selectScheduleLoading);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchSurgeriesRequest());
  }, [dispatch]);

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
    );
  }

  if (surgeries.length === 0) {
    return <p className="p-4 text-sm text-slate-500">수술 일정이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">수술일</th>
            <th className="px-3 py-2">수술명</th>
            <th className="px-3 py-2">환자ID</th>
            <th className="px-3 py-2">집도의ID</th>
            <th className="px-3 py-2">수술실</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">응급</th>
            <th className="px-3 py-2">기록</th>
          </tr>
        </thead>
        <tbody>
          {surgeries.map((surgery) => (
            <tr key={surgery.surgeryId} className="border-t border-slate-100">
              <td className="px-3 py-2">{surgery.surgeryDt}</td>
              <td className="px-3 py-2">{surgery.surgeryName ?? "-"}</td>
              <td className="px-3 py-2">{surgery.patientId}</td>
              <td className="px-3 py-2">{surgery.surgeonId}</td>
              <td className="px-3 py-2">{surgery.roomCode ?? "-"}</td>
              <td className="px-3 py-2">{surgery.statusCd}</td>
              <td className="px-3 py-2">
                {surgery.emergencyYn === "Y" ? "응급" : "-"}
              </td>
              <td className="px-3 py-2">
                {/* 마취기록·수술기록지는 수술 상세 화면에서 다룬다 */}
                <Link
                  href={`/surgery/schedule/detail/${surgery.surgeryId}`}
                  className="text-sky-600 underline"
                >
                  상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
