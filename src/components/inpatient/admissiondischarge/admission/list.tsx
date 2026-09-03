"use client"; // 이 컴포넌트는 브라우저에서 실행됨(useState/useEffect 등 훅을 쓰려면 필수)

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux"; // dispatch: 액션 보내기, useSelector: 스토어 값 읽기
import type { AppDispatch, RootState } from "@/store/store"; // 타입 전용 import(런타임 코드로는 안 남음)
import {
  fetchAdmissionsRequest, // 입원 목록 조회를 saga에 요청하는 액션
  selectAdmissions, // 스토어에서 입원 목록 배열을 꺼내는 selector
  selectAdmissionListStatus, // 로딩/에러 상태를 꺼내는 selector
} from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice"; // 병상배정 목록(다른 feature 슬라이스)
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice"; // 환자 목록(또 다른 feature 슬라이스, patient-service 쪽)
import AdmissionDetail from "@/components/inpatient/admissiondischarge/admission/detail"; // 마스터-디테일의 "디테일" 쪽 컴포넌트
import Link from "next/link"; // 페이지 이동용 링크 컴포넌트(a 태그의 Next.js 버전)
const FILTERS = [
  { key: "all", label: "전체" },
  { key: "needsAssignment", label: "배정 필요" },
  { key: "waitingAssigned", label: "입원대기(배정완료)" },
  { key: "admitted", label: "입원중" },
  { key: "dischargeRequested", label: "퇴원 신청" },
  { key: "discharged", label: "퇴원 완료" },
];
type FilterKey = (typeof FILTERS)[number]["key"];

// admission.status 값 → 배지 배경/글자 색상 Tailwind 클래스
// 백엔드 AdmissionEntity.status가 단순 문자열이라, 여기 키값은 백엔드 값과 철자가 정확히 같아야 매칭됨
const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  NEEDS_ASSIGNMENT: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  WAITING_ASSIGNED: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  ADMITTED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  DISCHARGE_REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  DISCHARGED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

// admission.status 값 → 화면에 보여줄 한글 라벨
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "입원대기",
  NEEDS_ASSIGNMENT: "배정 필요",
  WAITING_ASSIGNED: "입원대기(배정완료)",
  ADMITTED: "입원중",
  DISCHARGE_REQUESTED: "퇴원 신청",
  DISCHARGED: "퇴원 완료",
};

// 이 컴포넌트가 밖에서 받을 수 있는 값들의 타입 정의
type AdmissionListProps = {
  /** 입퇴원관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean; // ?는 optional — 안 넘겨도 됨
};

// { embedded = false }: 구조분해 + 기본값. props를 아예 안 넘기고 <AdmissionList />로 불러도
// 에러 안 나게 매개변수 자체에도 기본값(= {})을 줌
const AdmissionList = ({ embedded = false }: AdmissionListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>(); // 액션을 스토어(사가)로 보내는 함수
  const admissions = useSelector(selectAdmissions); // 입원 목록 배열 (초기엔 빈 배열)
  const listStatus = useSelector(selectAdmissionListStatus); // { loading, error }
  const bedAssignments = useSelector(selectBedAssignments); // 병상배정 목록 배열
  const patients = useSelector((state: RootState) => state.patient.patients); // 환자 목록 배열
  const [selectedId, setSelectedId] = useState<string | null>(null); // 지금 클릭해서 선택된 입원건 id (없으면 null)
  const [filterKey, setFilterKey] = useState<FilterKey>("needsAssignment"); // 현재 선택된 필터 키(기본값: 배정 필요)

  // patientId → patientName 변환용 Map. patients가 안 바뀌면 재계산 안 하도록 useMemo로 캐싱
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );

  // 컴포넌트가 처음 렌더링될 때(= 화면 열릴 때) 세 가지 데이터를 각각 따로 불러옴.
  // 서로 다른 서비스/테이블 데이터라서 API가 하나로 합쳐져 있지 않고, 프론트에서 조합해서 씀
  useEffect(() => {
    dispatch(fetchAdmissionsRequest()); // 입원 목록을 가져옵니다.
    dispatch(fetchBedAssignmentsRequest()); // 병상 배정 목록을 가져와서 입원건별 배정 여부를 판단합니다.
    dispatch(fetchPatientListRequest({}));// 환자 목록을 가져와서 patientId → patientName 매핑을 만듭니다.
  }, [dispatch]);

  // 이 admissionId로 걸린 배정 중, 아직 퇴상 처리 안 된(releasedAt === null) 게 하나라도 있으면 true
  const isBedAssigned = (admissionId: string) => // 입원건별 배정 여부를 판단합니다.
    bedAssignments.some((ba) => ba.admissionId === admissionId && ba.releasedAt === null); // 아직 퇴상 처리 안 된(releasedAt === null) 배정이 있으면 배정 완료로 간주

   const visibleAdmissions = useMemo(() => {
  switch (filterKey) {
    case "needsAssignment":
      return admissions.filter((a) => a.status === "REQUESTED" && !isBedAssigned(a.admissionId));
    case "waitingAssigned":
      return admissions.filter((a) => a.status === "REQUESTED" && isBedAssigned(a.admissionId));
    case "admitted":
      return admissions.filter((a) => a.status === "ADMITTED");
    case "dischargeRequested":
      return admissions.filter((a) => a.status === "DISCHARGE_REQUESTED");
    case "discharged":
      return admissions.filter((a) => a.status === "DISCHARGED");
    default:
      return admissions;
  }
}, [admissions, bedAssignments, filterKey]);



  return (
    // embedded면 탭 컨테이너 폭에 맞춰 꽉 채우고, 아니면 단독 페이지용 중앙정렬+여백
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}>
      <div className="mb-6 flex items-center justify-between">
        {/* embedded일 땐 탭 컴포넌트가 이미 "입퇴원관리" 제목을 보여주므로 여기선 빈 자리만 차지 */}
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-slate-800">입원 목록</h1>
            <p className="mt-1 text-sm text-slate-500">입원 접수된 환자 목록입니다.</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* 상태+병상배정 조합을 "할 일" 단위로 묶은 필터 탭 */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterKey(f.key)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  filterKey === f.key ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* 등록 화면으로 이동하는 링크 — embedded 여부와 상관없이 항상 노출 */}
          <Link
            href="/inpatient/admissiondischarge/admission/create"
            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            입원 요청 등록
          </Link>
        </div>
      </div>

      {/* fetch 진행 상태에 따른 안내 문구 — 로딩중이거나 에러면 아래 테이블 자체를 안 그림 */}
      {listStatus.loading && <p className="text-sm text-slate-500">로딩중...</p>}
      {listStatus.error && <p className="text-sm text-red-600">{listStatus.error}</p>}

      {!listStatus.loading && !listStatus.error && (
        // 좌: 목록 테이블(flex-1로 남는 공간 다 차지), 우: 선택됐을 때만 나타나는 상세 패널
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-4 py-3">입원ID</th>
                  <th className="whitespace-nowrap px-4 py-3">환자명</th>
                  <th className="whitespace-nowrap px-4 py-3">입원과ID</th>
                  <th className="whitespace-nowrap px-4 py-3">입원경로</th>
                  <th className="whitespace-nowrap px-4 py-3">입원날짜</th>
                  <th className="whitespace-nowrap px-4 py-3">환자ID</th>
                  <th className="whitespace-nowrap px-4 py-3">의사ID</th>
                  <th className="whitespace-nowrap px-4 py-3">상태</th>
                  <th className="whitespace-nowrap px-4 py-3">병상배정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* admissions 배열 길이만큼 <tr>을 하나씩 찍어냄. admissions가 비어있으면 아무 행도 안 그려짐 */}
                {visibleAdmissions.map((admission) => (
                  <tr
                    key={admission.admissionId} // React가 각 행을 구분하는 고유값 — 배열 렌더링엔 필수
                    onClick={() => setSelectedId(admission.admissionId)} // 클릭하면 이 행의 id를 선택 상태로 저장
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedId === admission.admissionId ? "bg-sky-50" : "" // 선택된 행만 파란 배경으로 강조
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-sky-700">{admission.admissionId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                      {/* patientId로 Map 조회 → 이름이 아직 없으면(patients 로딩 전) "조회중..." 표시 */}
                      {patientNameById.get(admission.patientId) ?? "조회중..."}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDeptId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionRoute}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.admissionDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.patientId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{admission.doctorId}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {/* STATUS_BADGE/LABEL에 없는 값이 오더라도(예상 못한 상태값) 깨지지 않게 기본 회색 스타일/원본 문자열로 대체 */}
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[admission.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {STATUS_LABEL[admission.status] ?? admission.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {/* isBedAssigned() 결과에 따라 배지 두 종류 중 하나만 보여줌 */}
                      {isBedAssigned(admission.admissionId) ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          배정완료
                        </span>
                      ) : admission.status === "ADMITTED" ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                          미배정 (확인 필요)
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                          미배정
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 필터링된 목록이 하나도 없을 때만 안내 문구 표시 */}
            {visibleAdmissions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">입원 데이터가 없습니다.</p>
            )}
          </div>

          {/* selectedId가 null이 아닐 때만(=행을 클릭했을 때만) 오른쪽 상세 패널이 나타남 */}
          {selectedId && (
            <div className="w-[420px] shrink-0">
              {/* admissionId를 prop으로 직접 전달(라우트 파라미터 아님), onClose로 선택 해제 콜백 전달 */}
              <AdmissionDetail admissionId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdmissionList;
