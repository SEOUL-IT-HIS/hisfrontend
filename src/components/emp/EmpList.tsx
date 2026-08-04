"use client";

/**
 * [직원 목록 화면]
 *
 * 구성:
 * - 왼쪽: 직원 목록 + 검색(프론트 필터) + 행 선택
 * - 오른쪽: EmpDetailPanel (선택 직원의 상세)
 *
 * 데이터 흐름:
 * 1) mount 시 fetchEmpRequest → saga → API → Redux emps
 * 2) mount 시 DEPT_CD / EMP_STATUS_CD 공통코드 조회 → 코드명 표시
 * 3) 검색은 DB 재조회 없이 emps 를 keyword/empStatus 로 필터 (useMemo)
 * 4) 행 클릭 → selectedEmpId → 오른쪽 패널에서 상세 API 호출
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmpDetailPanel from "@/components/emp/EmpDetailPanel";
import EmpRegisterForm from "@/components/emp/EmpRegisterForm";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Panel,
  Select,
} from "@/components/common";
import { fetchCommonCodeItemsByGroupCode } from "@/features/commonCode/api/commonCodeItemApi";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import { fetchEmpRequest } from "@/features/emp/slice/empSlice";
import {
  toCodeLabel,
  toCodeSelectOptions,
} from "@/features/emp/utils/empCodeLabel";
import type { RootState } from "@/store/store";

/** 목록 표시용 날짜 (앞 10자리 yyyy-MM-dd) */
function formatDate(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

export default function EmpList() {
  const dispatch = useDispatch();
  const emps = useSelector((state: RootState) => state.emp.emps);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const error = useSelector((state: RootState) => state.emp.error);

  const [registerOpen, setRegisterOpen] = useState(false);
  /** 왼쪽에서 선택한 직원 PK — 오른쪽 상세 패널에 전달 */
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  /** 공통코드: DEPT_CD / EMP_STATUS_CD */
  const [deptCodes, setDeptCodes] = useState<CommonCodeItem[]>([]);
  const [statusCodes, setStatusCodes] = useState<CommonCodeItem[]>([]);

  // ----- 검색 조건 (프론트 전용, API 파라미터 아님) -----
  const [keyword, setKeyword] = useState("");
  /** "" = 전체 */
  const [empStatusFilter, setEmpStatusFilter] = useState("");

  /**
   * 목록 필터
   * - emps(원본)는 Redux 에 유지
   * - keyword / empStatusFilter / emps 가 바뀔 때만 다시 계산 (useMemo)
   */
  const filteredEmps = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return emps.filter((emp) => {
      const deptName = toCodeLabel(deptCodes, emp.deptCode).toLowerCase();
      const matchKeyword =
        q === "" ||
        emp.empNo.toLowerCase().includes(q) ||
        emp.empName.toLowerCase().includes(q) ||
        (emp.deptCode ?? "").toLowerCase().includes(q) ||
        deptName.includes(q);
      const matchStatus =
        empStatusFilter === "" || emp.empStatus === empStatusFilter;
      return matchKeyword && matchStatus;
    });
  }, [emps, keyword, empStatusFilter, deptCodes]);

  // 화면 진입 시 직원 목록 + 공통코드 조회
  useEffect(() => {
    dispatch(fetchEmpRequest());

    async function loadCommonCodes() {
      const [depts, statuses] = await Promise.all([
        fetchCommonCodeItemsByGroupCode("DEPT_CD"),
        fetchCommonCodeItemsByGroupCode("EMP_STATUS_CD"),
      ]);
      setDeptCodes(depts);
      setStatusCodes(statuses);
    }
    void loadCommonCodes();
  }, [dispatch]);

  /** 검색 조건만 초기화 (목록 데이터는 유지) */
  function resetEmpSearch() {
    setKeyword("");
    setEmpStatusFilter("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">
            ADMIN
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            직원 관리
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            직원을 선택한 뒤 상세를 확인하고 수정합니다.
          </p>
        </div>
        <Button variant="primary" onClick={() => setRegisterOpen(true)}>
          직원 등록
        </Button>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* ========== 왼쪽: 직원 목록 ========== */}
        <Panel>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">직원 목록</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                행 클릭 시 상세 패널이 열립니다
              </p>
            </div>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
              {filteredEmps.length}
              {filteredEmps.length !== emps.length ? ` / ${emps.length}` : ""}
            </span>
          </div>

          {/* 검색 영역 */}
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <FormField
                label="검색어"
                htmlFor="empKeyword"
                className="min-w-[200px] flex-1"
              >
                <Input
                  id="empKeyword"
                  value={keyword}
                  placeholder="사번 / 이름 / 부서명"
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </FormField>
              <FormField
                label="재직상태"
                htmlFor="empStatusFilter"
                className="w-36"
              >
                <Select
                  id="empStatusFilter"
                  value={empStatusFilter}
                  placeholder="전체"
                  onChange={(e) => setEmpStatusFilter(e.target.value)}
                  options={toCodeSelectOptions(statusCodes)}
                />
              </FormField>
              <Button type="button" variant="secondary" onClick={resetEmpSearch}>
                초기화
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">사번</th>
                  <th className="px-5 py-3 font-medium">이름</th>
                  <th className="px-5 py-3 font-medium">부서</th>
                  <th className="px-5 py-3 font-medium">입사일</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading && emps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-20 text-center text-slate-400"
                    >
                      목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredEmps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-20 text-center text-slate-400"
                    >
                      {emps.length === 0
                        ? "등록된 직원이 없습니다. 우측 상단에서 직원을 등록하세요."
                        : "검색 조건에 맞는 직원이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredEmps.map((row) => {
                    const selected = selectedEmpId === row.empId;
                    return (
                      <tr
                        key={row.empId}
                        onClick={() => setSelectedEmpId(row.empId)}
                        className={
                          selected
                            ? "relative cursor-pointer bg-sky-50/80 transition-colors"
                            : "cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50"
                        }
                      >
                        <td className="relative px-5 py-3.5">
                          {selected ? (
                            <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-500" />
                          ) : null}
                          <span
                            className={
                              selected
                                ? "font-semibold tracking-wide text-sky-700"
                                : "font-semibold tracking-wide text-slate-800"
                            }
                          >
                            {row.empNo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {row.empName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {toCodeLabel(deptCodes, row.deptCode)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {formatDate(row.hireDate)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {toCodeLabel(statusCodes, row.empStatus)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ========== 오른쪽: 상세 패널 ========== */}
        <EmpDetailPanel
          empId={selectedEmpId}
          deptCodes={deptCodes}
          statusCodes={statusCodes}
        />
      </div>

      {/* 직원 등록 Modal */}
      <Modal
        open={registerOpen}
        title="직원 등록"
        onClose={() => setRegisterOpen(false)}
      >
        <EmpRegisterForm
          deptCodes={deptCodes}
          onClose={() => setRegisterOpen(false)}
        />
      </Modal>
    </div>
  );
}
