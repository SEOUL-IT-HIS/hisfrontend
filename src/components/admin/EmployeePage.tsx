"use client";

import { useEffect, useState } from "react";
import EmployeeEditModal from "@/components/admin/EmployeeEditModal";
import EmployeeRegisterModal from "@/components/admin/EmployeeRegisterModal";
import { createEmployee, getEmployees, updateEmployee } from "@/features/admin/api";
import { resolveAdmMessage } from "@/features/admin/messages";
import type {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from "@/features/admin/types";
import { EMP_STATUS_OPTIONS } from "@/features/admin/types";

function statusLabel(status: Employee["empStatus"]) {
  if (!status) return "-";
  return EMP_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      setLoading(true);
      setListError("");
      try {
        const list = await getEmployees();
        if (!cancelled) {
          setEmployees(list);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "목록 조회에 실패했습니다.";
          setListError(resolveAdmMessage(message));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegister(payload: CreateEmployeeRequest) {
    const created = await createEmployee(payload);
    setEmployees((prev) => [created, ...prev]);
  }

  async function handleUpdate(empId: number, payload: UpdateEmployeeRequest) {
    const updated = await updateEmployee(empId, payload);
    setEmployees((prev) => prev.map((emp) => (emp.empId === empId ? updated : emp)));
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <h2 className="text-base font-semibold text-slate-800">직원</h2>
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="h-9 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600"
        >
          직원등록
        </button>
      </div>

      {listError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {listError}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">사번</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">로그인 ID</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">입사일</th>
              <th className="px-4 py-3 font-medium">재직상태</th>
              <th className="px-4 py-3 font-medium">부서</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                  직원 목록을 불러오는 중입니다...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                  등록된 직원이 없습니다. 직원등록 버튼으로 추가하세요.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.empId} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-800">{emp.empNo}</td>
                  <td className="px-4 py-3 text-slate-800">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-800">{emp.loginId}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.hireDate ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{statusLabel(emp.empStatus)}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.deptCode ?? "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditingEmployee(emp)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={handleRegister}
      />

      <EmployeeEditModal
        open={editingEmployee !== null}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
