"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  cancelSurgeryRequest,
  fetchSurgeryRequestsRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectSurgeryRequests,
} from "@/features/surgery/schedule/slice";

/**
 * 수술 요청 대기 목록 (요청접수 00)
 *
 * <p>진료(일반)와 응급실(응급)에서 올라온 요청 중 아직 수술실이 잡히지 않은 건이다.
 * 수술실 담당자가 배정하면 예약(01)이 되어 이 목록에서 빠진다. 응급 건이 위로 오도록
 * 백엔드가 정렬해 내려주므로 화면에서 다시 정렬하지 않는다.</p>
 *
 * <p>환자명·집도의명을 표시하지 않는 이유 — 환자·직원 서비스가 소유한 데이터라 수술이
 * 저장하지 않으며(§14.1), 표시하려면 각 서비스 API 를 호출해야 한다(§21.9).</p>
 *
 * <p>여기서의 취소는 업무상 '반려'다. 행을 지우지 않고 취소(04) 상태로 전이시킨다(§21.6).</p>
 */
export default function SurgeryRequestList() {
  const dispatch = useDispatch<AppDispatch>();
  const requests = useSelector(selectSurgeryRequests);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchSurgeryRequestsRequest());
  }, [dispatch]);

  if (loading) {
    return <p className="p-4 text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500">배정 대기 중인 요청이 없습니다.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">구분</th>
            <th className="px-3 py-2">희망 수술일</th>
            <th className="px-3 py-2">수술명</th>
            <th className="px-3 py-2">환자ID</th>
            <th className="px-3 py-2">집도의ID</th>
            <th className="px-3 py-2">희망 수술실</th>
            <th className="px-3 py-2">요청일시</th>
            <th className="px-3 py-2">처리</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((surgery) => (
            <tr key={surgery.surgeryId} className="border-t border-slate-100">
              <td className="px-3 py-2">
                {surgery.emergencyYn === "Y" ? (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">
                    응급
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">일반</span>
                )}
              </td>
              <td className="px-3 py-2">{surgery.surgeryDt}</td>
              <td className="px-3 py-2">{surgery.surgeryName ?? "-"}</td>
              <td className="px-3 py-2">{surgery.patientId}</td>
              <td className="px-3 py-2">{surgery.surgeonId}</td>
              {/* 진료가 희망 수술실을 지정했더라도 확정은 배정 단계에서 한다 */}
              <td className="px-3 py-2">{surgery.roomCode ?? "-"}</td>
              <td className="px-3 py-2">{surgery.createdAt?.slice(0, 10)}</td>
              <td className="flex gap-3 px-3 py-2">
                <Link
                  href={`/surgery/schedule/assign/${surgery.surgeryId}`}
                  className="text-sky-600 underline"
                >
                  배정
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  className="text-slate-500 underline disabled:text-slate-300"
                  onClick={() => {
                    // 사유 코드는 SURGERY_CANCEL_CD 등록 후 선택 UI 로 교체한다
                    dispatch(cancelSurgeryRequest(surgery.surgeryId));
                  }}
                >
                  반려
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
