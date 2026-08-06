"use client"

import { fetchEncounterListRequest } from "@/features/outpatient/encounter/slice";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button} from "@/components/common";

const EncounterList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.outpatient.encounter.listStatus.loading,
        error: state.outpatient.encounter.listStatus.error,
        list: state.outpatient.encounter.list
    }), shallowEqual);

    useEffect(() => {
        dispatch(fetchEncounterListRequest({}));
    }, [dispatch]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h1 className="text-lg font-bold text-slate-800">당일 외래 환자 목록</h1>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                <p className="p-4 text-center text-slate-500">환자 목록을 불러오는 중입니다...</p>
            ) : (
                <div className="min-h-[500px] rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="w-[150px] p-3 font-semibold">환자번호</th>
                            <th className="w-[150px] p-3 font-semibold">환자명</th>
                            <th className="w-[150px] p-3 font-semibold">진료과</th>
                            <th className="w-[150px] p-3 font-semibold">상태</th>
                            <th className="w-[150px] p-3 font-semibold">내원일</th>
                            <th className="w-[150px] p-3 font-semibold">관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {list && list.length > 0 ? (
                            list.map((enc) => (
                                <tr key={enc.encounterId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{enc.patientNo}</td>
                                    <td className="p-3">{enc.patientName}</td>
                                    <td className="p-3">{enc.departmentCode}</td>
                                    <td className="p-3">{enc.status}</td>
                                    <td className="p-3">{enc.visitDate}</td>
                                    <td className="p-3 text-right">
                                        <Link href={`/outpatient/records?encounterId=${enc.encounterId}`}>
                                            <Button variant="secondary" >진료기록 보기</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-500">
                                    조회된 환자가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EncounterList;