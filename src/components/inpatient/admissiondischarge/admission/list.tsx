"use client"; // 이 컴포넌트는 브라우저에서 실행됨(useState/useEffect 등 훅을 쓰려면 필수)

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDepartmentNames } from "@/features/commonCode/hooks/useDepartmentNames";
import { formatDateTime, useDayStart } from "@/features/inpatient/dateLimits";
import { formatSexAge } from "@/features/inpatient/displayFormat";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import InpatientTabs from "@/components/inpatient/common/InpatientTabs";
import Toolbar from "@/components/inpatient/common/Toolbar";
import type { AdmissionDTO } from "@/features/inpatient/admissiondischarge/types";

// "All" 탭에는 진행 중 입원 + 최근 7일 안에 퇴원한 건만 (전체 퇴원 이력은 "Discharged" 탭)
const RECENT_DISCHARGE_DAYS = 7;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needsAssignment", label: "Assignment Needed" },
  { key: "waitingAssigned", label: "Waiting (Bed Assigned)" },
  { key: "admitted", label: "Admitted" },
  { key: "dischargeRequested", label: "Discharge Requested" },
  { key: "discharged", label: "Discharged" },
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
  REQUESTED: "Waiting for Admission",
  NEEDS_ASSIGNMENT: "Assignment Needed",
  WAITING_ASSIGNED: "Waiting (Bed Assigned)",
  ADMITTED: "Admitted",
  DISCHARGE_REQUESTED: "Discharge Requested",
  DISCHARGED: "Discharged",
};

// 이 컴포넌트가 밖에서 받을 수 있는 값들의 타입 정의
type AdmissionListProps = {
  /** 입퇴원관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean; // ?는 optional — 안 넘겨도 됨
};

// { embedded = false }: 구조분해 + 기본값. props를 아예 안 넘기고 <AdmissionList />로 불러도
// 에러 안 나게 매개변수 자체에도 기본값(= {})을 줌
const AdmissionList = ({ embedded = false }: AdmissionListProps = {}) => {
  // 담당의 ID(empId) → 의사 이름 (admin 의사 목록). 목록에 없는 예전 값은 ID 그대로 표시
  const { nameById: doctorNameById } = useDoctorOptions();
  // 진료과 코드(DEPT_CD) → 진료과명. 공통코드를 못 불러오면 코드값 그대로 표시
  const { names: deptNames } = useDepartmentNames();
  // 최근 퇴원 기준 시각 "7일 전 00:00" (브라우저 시간, 서버 렌더에서는 undefined → 전체 표시)
  const dischargeCutoff = useDayStart(-RECENT_DISCHARGE_DAYS);
  const dispatch = useDispatch<AppDispatch>(); // 액션을 스토어(사가)로 보내는 함수
  const admissions = useSelector(selectAdmissions); // 입원 목록 배열 (초기엔 빈 배열)
  const listStatus = useSelector(selectAdmissionListStatus); // { loading, error }
  const bedAssignments = useSelector(selectBedAssignments); // 병상배정 목록 배열
  const patients = useSelector((state: RootState) => state.patient.patients); // 환자 목록 배열
  // ?filter=waitingAssigned&admissionId=... 로 들어오면 그 필터와 입원 건을 미리 선택 (병상배정 등록 후 돌아올 때 사용)
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("admissionId")); // 지금 클릭해서 선택된 입원건 id (없으면 null)
  const [filterKey, setFilterKey] = useState<FilterKey>(
    FILTERS.some((f) => f.key === filterParam) ? (filterParam as FilterKey) : "needsAssignment",
  ); // 현재 선택된 필터 키(기본값: 배정 필요)

  // patientId → patientName 변환용 Map. patients가 안 바뀌면 재계산 안 하도록 useMemo로 캐싱
  const patientNameById = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, patient.patientName])),
    [patients],
  );
  // patientId → 성별/나이 ("F / 34") — 환자 ID(UUID) 대신 화면에 보여줄 값
  const sexAgeByPatientId = useMemo(
    () => new Map(patients.map((patient) => [patient.patientId, formatSexAge(patient.genderCd, patient.birthDate)])),
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
  // 선택한 입원 건을 "입원 확정"(REQUESTED → ADMITTED)하면 Admitted 필터로 넘어가서 방금 처리한 건을 계속 보여줌
  // (Waiting 필터에 그대로 두면 확정된 건이 목록에서 빠져 사라진 것처럼 보임)
  // - 같은 입원 건의 상태가 바뀐 경우만 — 다른 행을 클릭해서 선택이 바뀐 경우는 필터를 건드리지 않음
  // - effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식 (effect 안 setState는 렌더링을 한 번 더 일으킴)
  const selectedStatus = admissions.find((a) => a.admissionId === selectedId)?.status;
  const [prevSelected, setPrevSelected] = useState({ id: selectedId, status: selectedStatus });
  if (prevSelected.id !== selectedId || prevSelected.status !== selectedStatus) {
    setPrevSelected({ id: selectedId, status: selectedStatus });
    if (prevSelected.id === selectedId && prevSelected.status === "REQUESTED" && selectedStatus === "ADMITTED") {
      setFilterKey("admitted");
    }
  }

  const isBedAssigned = (admissionId: string) => // 입원건별 배정 여부를 판단합니다.
    bedAssignments.some((ba) => ba.admissionId === admissionId && ba.releasedAt === null); // 아직 퇴상 처리 안 된(releasedAt === null) 배정이 있으면 배정 완료로 간주

  // 배정했다가 퇴상된 기록만 있는 입원건 — 퇴원 후 "Unassigned"(배정 안 됨)와 구분해서 "Released"로 표시
  const hasReleasedAssignment = (admissionId: string) =>
    bedAssignments.some((ba) => ba.admissionId === admissionId && ba.releasedAt !== null);

  // 최근 7일 안에 퇴원했는지 — 퇴원일이 없는 예전 퇴원 건은 "Discharged" 탭에서만 보임
  const isRecentDischarge = (dischargedAt: string | null | undefined) =>
    !dischargeCutoff || (!!dischargedAt && dischargedAt >= dischargeCutoff); // ISO 문자열이라 문자열 비교로 시각 비교

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
      // 전체 퇴원 이력 — 최근 퇴원 순
      return admissions
        .filter((a) => a.status === "DISCHARGED")
        .sort((a, b) => (b.dischargedAt ?? "").localeCompare(a.dischargedAt ?? ""));
    default:
      return admissions.filter((a) => a.status !== "DISCHARGED" || isRecentDischarge(a.dischargedAt));
  }
  // 위 판별 함수(isBedAssigned · isRecentDischarge)는 bedAssignments · dischargeCutoff만 쓰므로 그 둘을 의존성에 넣음
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [admissions, bedAssignments, filterKey, dischargeCutoff]);
  const hiddenDischargeCount =
    filterKey === "all" ? admissions.filter((a) => a.status === "DISCHARGED").length -
      visibleAdmissions.filter((a) => a.status === "DISCHARGED").length : 0;



  const columns: DataTableColumn<AdmissionDTO>[] = [
    // patientId로 Map 조회 → 이름이 아직 없으면(patients 로딩 전) "조회중..." 표시
    { key: "patient", header: "Patient Name", render: (a) => <span className="font-medium text-slate-800">{patientNameById.get(a.patientId) ?? "Looking up..."}</span> },
    { key: "sexAge", header: "Sex / Age", render: (a) => sexAgeByPatientId.get(a.patientId) ?? "-" },
    { key: "dept", header: "Admission Dept", render: (a) => (a.admissionDeptId ? deptNames[a.admissionDeptId] ?? a.admissionDeptId : "-") },
    {
      key: "route",
      header: "Admission Route",
      render: (a) => (
        <>
          {a.admissionRoute}
          {/* 응급 요청 중 격리가 필요한 건은 목록에서도 바로 보이게 표시 (배정 전 확인용) */}
          {a.isolationYn === "Y" && (
            <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
              Isolation
            </span>
          )}
        </>
      ),
    },
    { key: "admissionDate", header: "Admission Date", render: (a) => formatDateTime(a.admissionDate) },
    { key: "dischargedAt", header: "Discharge Date", render: (a) => formatDateTime(a.dischargedAt) },
    { key: "doctor", header: "Doctor", render: (a) => (a.doctorId ? doctorNameById.get(a.doctorId) ?? a.doctorId : "-") },
    {
      key: "status",
      header: "Status",
      // STATUS_BADGE/LABEL에 없는 값이 오더라도(예상 못한 상태값) 깨지지 않게 기본 회색 스타일/원본 문자열로 대체
      render: (a) => (
        <span
          className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_BADGE[a.status] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
          }`}
        >
          {STATUS_LABEL[a.status] ?? a.status}
        </span>
      ),
    },
    {
      key: "bed",
      header: "Bed Assignment",
      // isBedAssigned() 결과에 따라 배지 중 하나만 보여줌
      render: (a) =>
        isBedAssigned(a.admissionId) ? (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            Assigned
          </span>
        ) : hasReleasedAssignment(a.admissionId) ? (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            Released
          </span>
        ) : a.status === "ADMITTED" ? (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
            Unassigned (Check Required)
          </span>
        ) : (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
            Unassigned
          </span>
        ),
    },
  ];

  return (
    // embedded면 탭 컨테이너 폭에 맞춰 꽉 채우고, 아니면 단독 페이지용 중앙정렬+여백
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-[1800px] p-6"}`}>
      {/* embedded일 땐 홈이 이미 "입퇴원관리" 제목을 보여주므로 생략 */}
      {!embedded && <PageHeader title="Admission List" description="List of patients registered for admission." />}

      <Toolbar>
        {/* 상태+병상배정 조합을 "할 일" 단위로 묶은 필터 탭 */}
        <InpatientTabs variant="inline" tabs={FILTERS} active={filterKey} onChange={setFilterKey} />
        {hiddenDischargeCount > 0 && (
          <span className="text-xs text-slate-400">
            {hiddenDischargeCount} discharges older than {RECENT_DISCHARGE_DAYS} days → Discharged tab
          </span>
        )}
        {/* 병동 직접 등록 폼은 제거함 — 입원요청은 응급에서 Kafka(emergency.admission.requested.v1)로만 들어옴 */}
      </Toolbar>

      {listStatus.error && <Alert>{listStatus.error}</Alert>}

      {!listStatus.error && (
        // 좌: 목록 테이블(flex-1로 남는 공간 다 차지), 우: 선택됐을 때만 나타나는 상세 패널
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <DataTable
              columns={columns}
              rows={visibleAdmissions}
              rowKey={(a) => a.admissionId}
              onRowClick={(a) => setSelectedId(a.admissionId)}
              isRowActive={(a) => a.admissionId === selectedId}
              loading={listStatus.loading}
              loadingMessage="Loading..."
              emptyMessage="No admission data available."
            />
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
