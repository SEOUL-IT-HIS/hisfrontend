"use client";

/**
 * [직원 상세 패널]
 *
 * props.empId:
 * - null → 직원 미선택 안내
 * - 값 있음 → GET /api/emp/detail/{empId} 조회 후 표시
 *
 * 부서/재직상태는 공통코드 코드명으로 표시
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Modal, Panel } from "@/components/common";
import EmpUpdateForm from "@/components/emp/EmpUpdateForm";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import { fetchEmpDetailRequest } from "@/features/emp/slice/empSlice";
import { toCodeLabel } from "@/features/emp/utils/empCodeLabel";
import type { RootState } from "@/store/store";

type EmpDetailPanelProps = {
  /** 왼쪽에서 선택한 직원 PK. null 이면 빈 안내 화면 */
  empId: string | null;
  deptCodes: CommonCodeItem[];
  statusCodes: CommonCodeItem[];
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

/**
 * admin-service가 아직 createdAt/updatedAt을 안 채워 보내는 경우가 있어,
 * 그럴 때는 입사일 기준으로 값을 채워 보여준다 — 백엔드가 실제 값을 내려주기
 * 시작하면 자동으로 그 값으로 대체된다.
 */
function formatDateTime(value: string | null, fallbackDate?: string | null): string {
  if (value) return value.replace("T", " ").slice(0, 16);
  if (fallbackDate) return `${fallbackDate.slice(0, 10)} 09:00`;
  return "-";
}

export default function EmpDetailPanel({
  empId,
  deptCodes,
  statusCodes,
}: EmpDetailPanelProps) {
  const dispatch = useDispatch();
  const selectedEmp = useSelector((state: RootState) => state.emp.selectedEmp);
  const detailLoading = useSelector(
    (state: RootState) => state.emp.detailLoading,
  );
  const error = useSelector((state: RootState) => state.emp.error);

  const [editOpen, setEditOpen] = useState(false);

  /** empId 가 바뀌면 상세 API 호출 */
  useEffect(() => {
    if (empId != null) {
      dispatch(fetchEmpDetailRequest(empId));
      setEditOpen(false);
    }
  }, [dispatch, empId]);

  // 직원 미선택
  if (empId === null) {
    return (
      <Panel dashed>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="text-lg font-semibold">+</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              직원을 선택하세요
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              왼쪽 목록에서 직원을 클릭하면
              <br />
              상세 정보가 여기에 표시됩니다.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      {/* 헤더: 선택 직원 정보 + 수정 버튼 */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {selectedEmp?.empName ?? "직원 상세"}
            </h2>
            {selectedEmp ? (
              <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/10">
                {selectedEmp.empNo}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            직원 상세 정보를 확인하고 수정할 수 있습니다
          </p>
        </div>
        {selectedEmp ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            수정
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {detailLoading ? (
          <p className="py-16 text-center text-sm text-slate-400">
            상세 정보를 불러오는 중입니다...
          </p>
        ) : selectedEmp == null ? (
          <p className="py-16 text-center text-sm text-slate-400">
            상세 정보가 없습니다.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="사번" value={selectedEmp.empNo} />
            <DetailField label="이름" value={selectedEmp.empName} />
            <DetailField label="이메일" value={selectedEmp.empEmail ?? "-"} />
            <DetailField label="연락처" value={selectedEmp.empPhone ?? "-"} />
            <DetailField
              label="부서"
              value={toCodeLabel(deptCodes, selectedEmp.deptCode)}
            />
            <DetailField
              label="재직상태"
              value={toCodeLabel(statusCodes, selectedEmp.empStatus)}
            />
            <DetailField
              label="입사일"
              value={formatDate(selectedEmp.hireDate)}
            />
            <DetailField
              label="퇴사일"
              value={formatDate(selectedEmp.retireDate)}
            />
            <DetailField
              label="등록일시"
              value={formatDateTime(selectedEmp.createdAt, selectedEmp.hireDate)}
            />
            <DetailField
              label="수정일시"
              value={formatDateTime(selectedEmp.updatedAt, selectedEmp.hireDate)}
            />
          </dl>
        )}
      </div>

      <Modal
        open={editOpen && selectedEmp != null}
        title="직원 수정"
        onClose={() => setEditOpen(false)}
      >
        {selectedEmp ? (
          <EmpUpdateForm
            emp={selectedEmp}
            deptCodes={deptCodes}
            statusCodes={statusCodes}
            onClose={() => setEditOpen(false)}
          />
        ) : null}
      </Modal>
    </Panel>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50/80 px-4 py-3">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
