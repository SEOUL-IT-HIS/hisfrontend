"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmployeeEditModal from "@/components/admin/EmployeeEditModal";
import EmployeeRegisterModal from "@/components/admin/EmployeeRegisterModal";
import {
  Alert,
  Button,
  DataTable,
  Input,
  type DataTableColumn,
} from "@/components/common";
import {
  clearSaveStatus,
  createEmployeeRequest,
  fetchEmployeesRequest,
  selectEmployeeSaveError,
  selectEmployeeSaveStatus,
  selectEmployeeSaving,
  selectEmployees,
  selectEmployeesError,
  selectEmployeesLoading,
  updateEmployeeRequest,
} from "@/features/admin/slice";
import type {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from "@/features/admin/types";
import {
  fetchCommonCodesRequest,
  selectCommonCodesByGroup,
} from "@/features/commoncode/slice";
import { CODE_GROUP } from "@/features/commoncode/types";
import type { AppDispatch } from "@/store/store";

/** 예전 EMP_STATUS 값 → 공통코드 EMP_STATUS_CD */
const LEGACY_EMP_STATUS: Record<string, string> = {
  ACTIVE: "01",
  LEAVE: "02",
  RETIRED: "03",
};

/**
 * 화면(Presentation)
 * - 왼쪽: 직원 목록 / 오른쪽: 이름 클릭 시 상세
 * - API 직접 호출 X → dispatch(Request)
 */
export default function EmployeePage() {
  const dispatch = useDispatch<AppDispatch>();

  const employees = useSelector(selectEmployees);
  const loading = useSelector(selectEmployeesLoading);
  const listError = useSelector(selectEmployeesError);
  const saving = useSelector(selectEmployeeSaving);
  const saveStatus = useSelector(selectEmployeeSaveStatus);
  const saveError = useSelector(selectEmployeeSaveError);
  const empStatusCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.EMP_STATUS_CD));
  const deptCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DEPT_CD));

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  /** 입력 중인 검색어 */
  const [keywordInput, setKeywordInput] = useState("");
  /** 조회 버튼으로 확정된 검색어 */
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    dispatch(fetchEmployeesRequest());
    dispatch(fetchCommonCodesRequest({ groupCode: CODE_GROUP.EMP_STATUS_CD }));
    dispatch(fetchCommonCodesRequest({ groupCode: CODE_GROUP.DEPT_CD }));
  }, [dispatch]);

  /** 목록이 갱신되면 선택 중인 직원도 최신 데이터로 맞춤 */
  useEffect(() => {
    if (selectedEmployee == null) {
      return;
    }
    const latest = employees.find((e) => e.empId === selectedEmployee.empId);
    setSelectedEmployee(latest ?? null);
  }, [employees, selectedEmployee?.empId]);

  /** 등록/수정 성공 시 모달 닫기 */
  useEffect(() => {
    if (saveStatus !== "success") {
      return;
    }
    if (registerOpen) {
      setRegisterOpen(false);
    }
    if (editingEmployee !== null) {
      setEditingEmployee(null);
    }
    dispatch(clearSaveStatus());
  }, [saveStatus, registerOpen, editingEmployee, dispatch]);

  function codeLabel(
    codes: { codeValue: string; codeName: string }[],
    codeValue: string | null | undefined,
  ) {
    if (!codeValue) return "-";
    return codes.find((c) => c.codeValue === codeValue)?.codeName ?? codeValue;
  }

  /** 재직상태: 공통코드명 (01→재직). 예전 ACTIVE 값은 01로 치환 */
  function empStatusLabel(empStatus: string | null | undefined) {
    if (!empStatus) return "-";
    const normalized = LEGACY_EMP_STATUS[empStatus] ?? empStatus;
    return codeLabel(empStatusCodes, normalized);
  }

  const filteredEmployees = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) {
      return employees;
    }
    return employees.filter((emp) => {
      const empStatusText = empStatusLabel(emp.empStatus).toLowerCase();
      const deptText = codeLabel(deptCodes, emp.deptCode).toLowerCase();
      return (
        emp.empNo.toLowerCase().includes(key) ||
        emp.name.toLowerCase().includes(key) ||
        (emp.loginId ?? "").toLowerCase().includes(key) ||
        (emp.accountStatus ?? "").toLowerCase().includes(key) ||
        empStatusText.includes(key) ||
        deptText.includes(key)
      );
    });
  }, [employees, keyword, empStatusCodes, deptCodes]);

  function handleOpenRegister() {
    dispatch(clearSaveStatus());
    setRegisterOpen(true);
  }

  function handleCloseRegister() {
    if (saving) {
      return;
    }
    setRegisterOpen(false);
    dispatch(clearSaveStatus());
  }

  function handleOpenEdit(emp: Employee) {
    dispatch(clearSaveStatus());
    setEditingEmployee(emp);
  }

  function handleCloseEdit() {
    if (saving) {
      return;
    }
    setEditingEmployee(null);
    dispatch(clearSaveStatus());
  }

  function handleRegister(payload: CreateEmployeeRequest) {
    dispatch(createEmployeeRequest(payload));
  }

  function handleUpdate(empId: number, payload: UpdateEmployeeRequest) {
    dispatch(updateEmployeeRequest({ empId, payload }));
  }

  function handleSelect(emp: Employee) {
    setSelectedEmployee(emp);
  }

  function handleSearch() {
    setKeyword(keywordInput.trim());
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  const columns: DataTableColumn<Employee>[] = [
    {
      key: "empNo",
      header: "사번",
      render: (emp) => emp.empNo,
    },
    {
      key: "name",
      header: "이름",
      render: (emp) => (
        <button
          type="button"
          onClick={() => handleSelect(emp)}
          className={`text-left hover:underline ${
            selectedEmployee?.empId === emp.empId
              ? "font-semibold text-sky-700"
              : "text-sky-600"
          }`}
        >
          {emp.name}
        </button>
      ),
    },
    {
      key: "deptCode",
      header: "부서",
      className: "text-slate-600",
      render: (emp) => codeLabel(deptCodes, emp.deptCode),
    },
    {
      key: "empStatus",
      header: "재직상태",
      className: "text-slate-600",
      render: (emp) => empStatusLabel(emp.empStatus),
    },
    {
      key: "accountStatus",
      header: "계정상태",
      className: "text-slate-600",
      render: (emp) => emp.accountStatus ?? "-",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* 상단: 작은 검색창 + 조회 + 등록 */}
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
        <Input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="사번/이름/로그인ID"
          className="h-8 w-56 max-w-[40%] shrink-0"
        />
        <Button
          variant="secondary"
          className="h-8 shrink-0 px-3 text-xs"
          onClick={handleSearch}
        >
          조회
        </Button>
        <div className="flex-1" />
        <Button variant="primary" className="h-8 shrink-0 px-3 text-xs" onClick={handleOpenRegister}>
          직원등록
        </Button>
      </div>

      {listError ? <Alert variant="error">{listError}</Alert> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-2">
          <DataTable
            className="!flex-1"
            columns={columns}
            rows={filteredEmployees}
            rowKey={(emp) => emp.empId}
            loading={loading}
            loadingMessage="직원 목록을 불러오는 중입니다..."
            emptyMessage="등록된 직원이 없습니다. 직원등록 버튼으로 추가하세요."
            minWidthClassName="min-w-0"
            equalColumns
          />
        </section>

        <section className="flex min-h-0 flex-col gap-2">
          <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4">
            <h2 className="text-sm font-semibold text-slate-800">상세 정보</h2>
            {selectedEmployee ? (
              <Button
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={() => handleOpenEdit(selectedEmployee)}
              >
                수정
              </Button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-4">
            {selectedEmployee == null ? (
              <p className="py-16 text-center text-sm text-slate-400">
                이름을 클릭하면 상세 정보가 표시됩니다.
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <DetailItem label="사번" value={selectedEmployee.empNo} />
                <DetailItem label="이름" value={selectedEmployee.name} />
                <DetailItem label="로그인 ID" value={selectedEmployee.loginId} />
                <DetailItem
                  label="계정상태"
                  value={selectedEmployee.accountStatus ?? "-"}
                />
                <DetailItem
                  label="재직상태"
                  value={empStatusLabel(selectedEmployee.empStatus)}
                />
                <DetailItem
                  label="부서"
                  value={codeLabel(deptCodes, selectedEmployee.deptCode)}
                />
                <DetailItem label="이메일" value={selectedEmployee.email ?? "-"} />
                <DetailItem label="연락처" value={selectedEmployee.phone ?? "-"} />
                <DetailItem label="입사일" value={selectedEmployee.hireDate ?? "-"} />
                <DetailItem label="퇴사일" value={selectedEmployee.retireDate ?? "-"} />
                <DetailItem
                  label="등록일시"
                  value={selectedEmployee.createdAt ?? "-"}
                />
                <DetailItem
                  label="수정일시"
                  value={selectedEmployee.updatedAt ?? "-"}
                />
              </dl>
            )}
          </div>
        </section>
      </div>

      <EmployeeRegisterModal
        open={registerOpen}
        submitting={saving && registerOpen}
        apiError={registerOpen ? saveError : ""}
        onClose={handleCloseRegister}
        onSubmit={handleRegister}
      />

      <EmployeeEditModal
        open={editingEmployee !== null}
        employee={editingEmployee}
        submitting={saving && editingEmployee !== null}
        apiError={editingEmployee !== null ? saveError : ""}
        onClose={handleCloseEdit}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
