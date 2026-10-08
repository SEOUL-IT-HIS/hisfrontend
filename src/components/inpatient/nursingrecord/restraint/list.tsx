"use client";

import { useEffect, useMemo } from "react";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { RESTRAINT_TYPE_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import Link from "next/link";
import { fetchRestraintsRequest, selectRestraints, selectRestraintListStatus } from "@/features/inpatient/nursingrecord/restraint/slice";
import { Alert, DataTable, PageHeader, type DataTableColumn } from "@/components/common";
import { usePatientNameByAdmission } from "@/features/inpatient/nursingrecord/usePatientNameByAdmission";
import Toolbar from "@/components/inpatient/common/Toolbar";
import LinkButton from "@/components/inpatient/common/LinkButton";

type RestraintListProps = {
  /** 간호기록관리 홈 탭 안에 끼워 넣을 때 true — 자체 제목/여백을 생략 */
  embedded?: boolean;
  /** 간호기록 홈에서 선택한 입원 건 — 있으면 그 입원 건 기록만 보여주고, 없으면(단독 목록 페이지) 전체 */
  admissionId?: string | null;
  /** 퇴원 완료된 입원 건이면 true — 기록 조회만 하고 등록 버튼은 숨김 */
  readOnly?: boolean;
};

const RestraintList = ({ embedded = false, admissionId = null, readOnly = false }: RestraintListProps = {}) => {
    // 오더 의사 직원 ID(empId) → 의사 이름 (목록에 없는 예전 값은 그대로 표시)
    const { nameById: doctorNameById } = useDoctorOptions();
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
  const dispatch = useDispatch<AppDispatch>();
  const restraints = useSelector(selectRestraints);
  const listStatus = useSelector(selectRestraintListStatus);
  // 기록의 입원 건 → 환자 이름 (입원·환자 목록은 홈이 이미 불러와 두므로 비어 있을 때만 요청)
  const { patientNameOf } = usePatientNameByAdmission();

  // 서버가 이미 이 입원 건의 기록만 주지만(?admissionId=), 서버가 예전 버전이면 전체가 올 수 있어서
  // 다른 환자의 기록이 섞여 보이지 않도록 한 번 더 거름 (이미 걸러진 목록이라 비용은 거의 없음)
  const visibleRestraints = useMemo(
    () => (admissionId ? restraints.filter((restraint) => restraint.admissionId === admissionId) : restraints),
    [restraints, admissionId],
  );

  // 선택한 입원 건의 기록만 서버에서 받음 (admissionId 가 없으면 전체 — 단독 목록 페이지). 환자가 바뀌면 다시 받음
  useEffect(() => {
    dispatch(fetchRestraintsRequest(admissionId ?? undefined));
  }, [dispatch, admissionId]);


  const columns: DataTableColumn<(typeof visibleRestraints)[number]>[] = [
    { key: "patientname", header: "Patient Name", render: (restraint) => <span className="font-medium text-slate-800">{patientNameOf(restraint.admissionId)}</span> },
    { key: "details", header: "Details", render: (restraint) => <Link href={`/inpatient/nursingrecord/restraint/${restraint.restraintId}`} className="font-medium text-sky-700 hover:underline">View</Link> },
    { key: "restrainttypecode", header: "Restraint Type Code", render: (restraint) => codeLabel(RESTRAINT_TYPE_OPTIONS, restraint.restraintTypeCd) },
    { key: "appliedat", header: "Applied At", render: (restraint) => new Date(restraint.appliedAt).toLocaleString() },
    { key: "reason", header: "Reason", render: (restraint) => restraint.reason },
    { key: "orderingdoctor", header: "Ordering Doctor", render: (restraint) => restraint.doctorOrderId ? doctorNameById.get(restraint.doctorOrderId) ?? restraint.doctorOrderId : "-" },
    { key: "evaluatedby", header: "Evaluated By", render: (restraint) => restraint.evaluatorId ? nurseNameById.get(restraint.evaluatorId) ?? restraint.evaluatorId : "-" },
    { key: "createdat", header: "Created At", render: (restraint) => new Date(restraint.createdAt).toLocaleString() },
    { key: "updatedat", header: "Updated At", render: (restraint) => new Date(restraint.updatedAt).toLocaleString() },
  ];

  return (
    <div className={`flex flex-col gap-4 ${embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6"}`}>
      {!embedded && <PageHeader title="Patient Restraint List" description="Restraint records by patient." />}

      <Toolbar
        actions={
          !readOnly && (
            <LinkButton href={`/inpatient/nursingrecord/restraint/create${admissionId ? `?admissionId=${admissionId}` : ""}`}>Register Restraint</LinkButton>
          )
        }
      >
        <span className="text-sm text-slate-500">{visibleRestraints.length} records</span>
      </Toolbar>

      {listStatus.error ? (
        <Alert>{listStatus.error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={visibleRestraints}
          rowKey={(restraint) => restraint.restraintId}
          loading={listStatus.loading}
          loadingMessage="Loading..."
          emptyMessage="No restraint data available."
        />
      )}
    </div>
  );
};

export default RestraintList;
