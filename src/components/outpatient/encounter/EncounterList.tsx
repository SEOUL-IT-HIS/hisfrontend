"use client"

import { fetchEncounterListRequest } from "@/features/outpatient/encounter/slice";
import { AppDispatch, RootState } from "@/store/store";
import Link from "next/link";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

const EncounterList = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.outpatient.encounter.listStatus.loading,
        error: state.outpatient.encounter.listStatus.error,
        list: state.outpatient.encounter.list
    }), shallowEqual);

    useEffect(() => {
        dispatch(fetchEncounterListRequest({})); // 검색조건 없으면 백엔드가 오늘 날짜로 처리
    }, []);

    return (
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading &&
                <table>
                    <thead>
                    <tr>
                        <th>환자번호</th>
                        <th>환자명</th>
                        <th>진료과</th>
                        <th>상태</th>
                        <th>내원일</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {list.map((enc) => (
                        <tr key={enc.encounterId}>
                            <td>{enc.patientNo}</td>
                            <td>{enc.patientName}</td>
                            <td>{enc.departmentCode}</td>
                            <td>{enc.status}</td>
                            <td>{enc.visitDate}</td>
                            <td>
                                <Link href={`/outpatient/records?encounterId=${enc.encounterId}`}>
                                    <button>진료기록 보기</button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            }
        </div>
    );
};

export default EncounterList;