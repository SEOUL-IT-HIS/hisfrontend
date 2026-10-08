"use client";

import { useEffect, useMemo } from "react";
import { MENTAL_STATUS_OPTIONS, YN_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import Link from "next/link";
import { fetchNursingAssessmentsRequest, selectNursingAssessments, selectNursingAssessmentListStatus } from "@/features/inpatient/nursingrecord/nursingassessment/slice";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import { usePatientNameByAdmission } from "@/features/inpatient/nursingrecord/usePatientNameByAdmission";
import Toolbar from "@/components/inpatient/common/Toolbar";
import LinkButton from "@/components/inpatient/common/LinkButton";

type NursingAssessmentListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
  /** 퇴원 완료된 입원 건이면 true — 기록 조회만 하고 등록 버튼은 숨김 */
  readOnly?: boolean;
};

const NursingAssessmentList = ({ embedded = false, admissionId = null, readOnly = false }: NursingAssessmentListProps = {}) => {
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
  const dispatch = useDispatch<AppDispatch>();
  const nursingAssessments = useSelector(selectNursingAssessments);
  const listStatus = useSelector(selectNursingAssessmentListStatus);
  // 기록의 입원 건 → 환자 이름 (입원·환자 목록은 홈이 이미 불러와 두므로 비어 있을 때만 요청)
  const { patientNameOf } = usePatientNameByAdmission();

  // 서버가 이미 이 입원 건의 기록만 주지만(?admissionId=), 서버가 예전 버전이면 전체가 올 수 있어서
  // 다른 환자의 기록이 섞여 보이지 않도록 한 번 더 거름 (이미 걸러진 목록이라 비용은 거의 없음)
  const visibleNursingAssessments = useMemo(
    () => (admissionId ? nursingAssessments.filter((nursingAssessment) => nursingAssessment.admissionId === admissionId) : nursingAssessments),
    [nursingAssessments, admissionId],
  );

  // 선택한 입원 건의 기록만 서버에서 받음 (admissionId 가 없으면 전체 — 단독 목록 페이지). 환자가 바뀌면 다시 받음
  useEffect(() => {
    dispatch(fetchNursingAssessmentsRequest(admissionId ?? undefined));
  }, [dispatch, admissionId]);


  const columns: DataTableColumn<(typeof visibleNursingAssessments)[number]>[] = [
    { key: "patientname", header: "Patient Name", render: (nursingAssessment) => <span className="font-medium text-slate-800">{patientNameOf(nursingAssessment.admissionId)}</span> },
    { key: "details", header: "Details", render: (nursingAssessment) => <Link href={`/inpatient/nursingrecord/nursingassessment/${nursingAssessment.nursingAssessmentId}`} className="font-medium text-sky-700 hover:underline">View</Link> },
    { key: "allergyyn", header: "Allergy Yn", render: (nursingAssessment) => codeLabel(YN_OPTIONS, nursingAssessment.allergyYn) },
    { key: "allergydetail", header: "Allergy Detail", render: (nursingAssessment) => nursingAssessment.allergyDetail },
    { key: "pastmedicalhistory", header: "Past Medical History", render: (nursingAssessment) => nursingAssessment.pastMedicalHistory },
    { key: "mentalstatuscode", header: "Mental Status Code", render: (nursingAssessment) => codeLabel(MENTAL_STATUS_OPTIONS, nursingAssessment.mentalStatusCd) },
    { key: "assessedat", header: "Assessed At", render: (nursingAssessment) => new Date(nursingAssessment.assessedAt).toLocaleString() },
    { key: "assessedby", header: "Assessed By", render: (nursingAssessment) => nursingAssessment.assessorId ? nurseNameById.get(nursingAssessment.assessorId) ?? nursingAssessment.assessorId : "-" },
    { key: "createdat", header: "Created At", render: (nursingAssessment) => new Date(nursingAssessment.createdAt).toLocaleString() },
    { key: "updatedat", header: "Updated At", render: (nursingAssessment) => new Date(nursingAssessment.updatedAt).toLocaleString() },
  ];

  return (
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}`}>
      {!embedded && <PageHeader title="Patient Nursing Assessment List" description="Nursing assessment records by patient." />}

      <Toolbar
        actions={
          !readOnly && (
            <LinkButton href={`/inpatient/nursingrecord/nursingassessment/create${admissionId ? `?admissionId=${admissionId}` : ""}`}>Register Assessment</LinkButton>
          )
        }
      >
        <span className="text-sm text-slate-500">{visibleNursingAssessments.length} records</span>
      </Toolbar>

      {listStatus.error ? (
        <Alert>{listStatus.error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleNursingAssessments}
          rowKey={(nursingAssessment) => nursingAssessment.nursingAssessmentId}
          loading={listStatus.loading}
          loadingMessage="Loading..."
          emptyMessage="No nursing assessment data available."
        />
      )}
    </div>
  );
};

export default NursingAssessmentList;
