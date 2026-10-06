"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch,RootState } from "@/store/store";
import {
  fetchBedAssignmentsRequest,
  selectBedAssignments,
  selectBedAssignmentListStatus,
} from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import LinkButton from "@/components/inpatient/common/LinkButton";
import Toolbar from "@/components/inpatient/common/Toolbar";
import type { BedAssignmentDTO } from "@/features/inpatient/bedmanagement/types";
import { useSearchParams } from "next/navigation";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import BedAssignmentDetail from "@/components/inpatient/bedmanagement/bedassignment/detail";
import { formatDateTime, useDayStart } from "@/features/inpatient/dateLimits";
import { formatBedLabel } from "@/features/inpatient/displayFormat";

// 기본 보기: 배정 중 + 최근 7일 안에 퇴상된 건 (그보다 오래된 이력은 "전체 이력 보기"로)
const RECENT_RELEASE_DAYS = 7;

type BedAssignmentListProps = {
  /** 병상관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
};

const BedAssignmentList = ({ embedded = false }: BedAssignmentListProps = {}) => {
  const dispatch = useDispatch<AppDispatch>();
  const bedAssignments = useSelector(selectBedAssignments);
  const listStatus = useSelector(selectBedAssignmentListStatus);
  const admissions = useSelector(selectAdmissions);
  const patients = useSelector((state: RootState) => state.patient.patients);
  const beds = useSelector(selectBed);
  const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const [selectedId, setSelectedId] = useState<number | null>(
  highlightParam ? Number(highlightParam) : null
  );

  
// 1단계: admissionId → patientId
// BED_ASSIGNMENT와 ADMISSION은 같은 DB(inpatient-service)에 있는 테이블이라,
// 백엔드에서 SQL(MyBatis든 JPA의 @Query JOIN이든) 한 번으로 합쳐서 patientId까지
// 내려줄 수 있음 — 즉 이 1단계 Map과 admissions fetch는 백엔드가 JOIN해주면 없앨 수 있음.
// 지금은 BedAssignmentServiceImpl이 JpaRepository.findAll()만 쓰고 JOIN 쿼리를
// 직접 짜지 않아서(=단순 JPA 방식), 프론트가 admissionId → patientId를 대신 이어붙이는 것.
const patientIdByAdmissionId = useMemo(
  () => new Map(admissions.map((a) => [a.admissionId, a.patientId])),
  [admissions],
);  

// 2단계: patientId → patientName
// PATIENT는 다른 서비스(patient-service)의 별도 DB에 있어서, 이건 MyBatis로 바꿔도
// SQL JOIN으로는 절대 못 합침 — 백엔드가 patient-service를 HTTP로 호출해서
// 미리 합쳐주지 않는 한, 프론트가 따로 fetch해서 이어붙이는 이 방식이 유일한 방법.
const patientNameById = useMemo(
  () => new Map(patients.map((p) => [p.patientId, p.patientName])),
  [patients],
);

// 병동: bedId → wardCd → 병동명
// BED_ASSIGNMENT에는 병동 컬럼이 없고 BED에만 wardCd가 있어서, 병상 목록으로 bedId → wardCd를 이어붙이고
// 병동명은 admin 공통코드(WARD_CD)에서 찾음. 공통코드를 못 불러오면 코드값을 그대로 보여줌
const wardCdByBedId = useMemo(
  () => new Map(beds.map((b) => [b.bedId, b.wardCd])),
  [beds],
);
const wardNameByCd = useMemo(
  () => new Map(wardOptions.map((opt) => [opt.value, opt.label])),
  [wardOptions],
);

  // 퇴상 이력 기간 필터 — 기준 시각은 "7일 전 00:00" (브라우저 시간, 서버 렌더에서는 undefined → 전체 표시)
  const [showAllHistory, setShowAllHistory] = useState(false);
  const releaseCutoff = useDayStart(-RECENT_RELEASE_DAYS);
  const visibleAssignments = useMemo(() => {
    const isRecent = (releasedAt: string | null) =>
      releasedAt === null || !releaseCutoff || releasedAt >= releaseCutoff; // ISO 문자열이라 문자열 비교로 시각 비교
    return bedAssignments
      .filter((a) => showAllHistory || isRecent(a.releasedAt) || a.assignmentId === selectedId)
      // 배정 중인 건 먼저(최근 배정 순), 그다음 퇴상 건(최근 퇴상 순)
      .sort((a, b) => {
        if ((a.releasedAt === null) !== (b.releasedAt === null)) return a.releasedAt === null ? -1 : 1;
        return a.releasedAt === null
          ? b.assignedAt.localeCompare(a.assignedAt)
          : (b.releasedAt ?? "").localeCompare(a.releasedAt ?? "");
      });
  }, [bedAssignments, showAllHistory, releaseCutoff, selectedId]);
  const hiddenCount = bedAssignments.length - visibleAssignments.length;

  // 지금 구조: bedAssignments/admissions/patients 세 가지를 각각 따로 fetch하고,
  // 위 두 Map으로 프론트에서 조립함(client-side join).
  // - bedAssignments + admissions → 백엔드가 JOIN 쿼리 하나로 합쳐주면 fetch 1번으로 줄일 수 있음
  // - patients(환자 이름) → 백엔드가 patient-service를 호출해서 미리 합쳐주지 않는 한 항상 별도 fetch 필요
  // 즉 "MyBatis를 쓰면 무조건 1번"이 아니라, "백엔드가 조합 로직을 갖고 있어야" 줄어드는 것
  useEffect(() => {
    dispatch(fetchBedAssignmentsRequest());
    dispatch(fetchAdmissionsRequest());
    dispatch(fetchPatientListRequest({}));
    dispatch(fetchBedRequest());
  }, [dispatch]);

  const columns: DataTableColumn<BedAssignmentDTO>[] = [
    {
      key: "patient",
      header: "Patient Name",
      render: (a) => (
        <span className="font-medium text-slate-800">
          {patientNameById.get(patientIdByAdmissionId.get(a.admissionId) ?? "") ?? "Unknown"}
        </span>
      ),
    },
    {
      key: "ward",
      header: "Ward",
      render: (a) => {
        const wardCd = wardCdByBedId.get(a.bedId);
        return wardCd ? wardNameByCd.get(wardCd) ?? wardCd : "-";
      },
    },
    { key: "bed", header: "Bed", render: (a) => formatBedLabel(a.bedId) },
    { key: "assignedAt", header: "Assigned At", render: (a) => formatDateTime(a.assignedAt) },
    { key: "releasedAt", header: "Released At", render: (a) => formatDateTime(a.releasedAt) },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const isActive = a.releasedAt === null;
        return (
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
              isActive
                ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
            }`}
          >
            {isActive ? "Assigned" : "Released"}
          </span>
        );
      },
    },
  ];

  return (
    // 화면 아래까지 꽉 채움 — 목록과 상세 패널이 각자 안에서 스크롤 (홈 탭 안에서는 남은 높이를, 단독 페이지에서는 화면 높이를 채움)
    <div className={`flex min-h-0 flex-col gap-4 ${embedded ? "w-full flex-1" : "mx-auto h-full w-full max-w-[1800px] p-6"}`}>
      {!embedded && (
        <PageHeader title="Bed Assignment List" description="A record of bed assignments and releases to date." />
      )}

      <Toolbar
        actions={
          <LinkButton href="/inpatient/bedmanagement/bedassignment/create?from=assignment">Register Assignment</LinkButton>
        }
      >
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showAllHistory}
            onChange={(e) => setShowAllHistory(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-sky-600"
          />
          Show all history
          {!showAllHistory && hiddenCount > 0 && (
            <span className="text-xs text-slate-400">({hiddenCount} older releases hidden)</span>
          )}
        </label>
      </Toolbar>

      {listStatus.error && <Alert>{listStatus.error}</Alert>}

      {!listStatus.error && (
        <div className="flex min-h-[480px] flex-1 gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DataTable
              columns={columns}
              rows={visibleAssignments}
              rowKey={(a) => a.assignmentId}
              onRowClick={(a) => setSelectedId(a.assignmentId)}
              isRowActive={(a) => a.assignmentId === selectedId}
              loading={listStatus.loading}
              loadingMessage="Loading..."
              emptyMessage={
                bedAssignments.length === 0
                  ? "No assignment data available."
                  : `No current assignments or releases in the last ${RECENT_RELEASE_DAYS} days.`
              }
            />
          </div>

          {selectedId !== null && (
            <div className="min-h-0 w-[420px] shrink-0 overflow-y-auto">
              <BedAssignmentDetail assignmentId={selectedId} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BedAssignmentList;
