"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  endSurgeryRequest,
  fetchTodaySurgeriesRequest,
  selectScheduleError,
  selectScheduleLoading,
  selectScheduleSaving,
  selectTodaySurgeries,
  startSurgeryRequest,
} from "@/features/surgery/schedule/slice";
import { SURGERY_STATUS } from "@/features/surgery/schedule/types";

/**
 * 금일 수술 현황 대시보드 (SL2-40)
 *
 * <p>백엔드 {@code GET /api/surgery/schedule/today} 가 오늘 날짜의 수술을 돌려준다.
 * 상태별로 나눠 보여줘, 지금 무엇이 밀려 있고 무엇이 진행 중인지 한눈에 보이게 한다.</p>
 *
 * <p>여기서 시작·종료 버튼을 두는 이유 — 수술 당일에 가장 자주 하는 조작이라
 * 상세 화면까지 들어가지 않고 바로 누를 수 있어야 한다. 상태 전이 규칙은
 * 백엔드가 검증하므로 잘못된 순서로 눌러도 안전하다(예약에서만 시작 가능).</p>
 */
export default function TodaySurgeryBoard() {
  const dispatch = useDispatch<AppDispatch>();
  const surgeries = useSelector(selectTodaySurgeries);
  const loading = useSelector(selectScheduleLoading);
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);

  useEffect(() => {
    dispatch(fetchTodaySurgeriesRequest());
  }, [dispatch]);

  if (loading && surgeries.length === 0) {
    return <p className="text-sm text-slate-500">불러오는 중입니다…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
    );
  }

  if (surgeries.length === 0) {
    return <p className="text-sm text-slate-500">금일 예정된 수술이 없습니다.</p>;
  }

  // 상태별 건수 — 코드값을 직접 세지 않고 상수를 쓴다(오타를 컴파일러가 잡도록)
  const countOf = (status: string) =>
    surgeries.filter((s) => s.statusCd === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {[
          { label: "예약", code: SURGERY_STATUS.SCHEDULED },
          { label: "진행중", code: SURGERY_STATUS.IN_PROGRESS },
          { label: "완료", code: SURGERY_STATUS.COMPLETED },
          { label: "취소", code: SURGERY_STATUS.CANCELLED },
        ].map((s) => (
          <div
            key={s.code}
            className="rounded-lg border border-slate-200 px-4 py-3 text-center"
          >
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-lg font-semibold text-slate-800">
              {countOf(s.code)}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">수술명</th>
              <th className="px-3 py-2">환자ID</th>
              <th className="px-3 py-2">수술실</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">응급</th>
              <th className="px-3 py-2">시작</th>
              <th className="px-3 py-2">종료</th>
              <th className="px-3 py-2">조작</th>
              <th className="px-3 py-2">상세</th>
            </tr>
          </thead>
          <tbody>
            {surgeries.map((surgery) => (
              <tr key={surgery.surgeryId} className="border-t border-slate-100">
                <td className="px-3 py-2">{surgery.surgeryName ?? "-"}</td>
                <td className="px-3 py-2">{surgery.patientId}</td>
                <td className="px-3 py-2">{surgery.roomCode ?? "미배정"}</td>
                <td className="px-3 py-2">{surgery.statusCd}</td>
                <td className="px-3 py-2">
                  {surgery.emergencyYn === "Y" ? "응급" : "-"}
                </td>
                <td className="px-3 py-2">{surgery.actualStartDt ?? "-"}</td>
                <td className="px-3 py-2">{surgery.actualEndDt ?? "-"}</td>
                <td className="px-3 py-2">
                  {/* 예약(01)이면 시작, 진행중(02)이면 종료만 노출한다 */}
                  {surgery.statusCd === SURGERY_STATUS.SCHEDULED && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        dispatch(startSurgeryRequest(surgery.surgeryId))
                      }
                      className="rounded-md bg-sky-500 px-3 py-1 text-xs text-white disabled:bg-slate-300"
                    >
                      시작
                    </button>
                  )}
                  {surgery.statusCd === SURGERY_STATUS.IN_PROGRESS && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        dispatch(endSurgeryRequest(surgery.surgeryId))
                      }
                      className="rounded-md bg-slate-700 px-3 py-1 text-xs text-white disabled:bg-slate-300"
                    >
                      종료
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
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
    </div>
  );
}
