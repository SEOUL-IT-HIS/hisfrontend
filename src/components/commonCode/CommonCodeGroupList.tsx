"use client";

/**
 * [공통코드 그룹 목록 화면]
 *
 * 구성:
 * - 왼쪽: 그룹 목록 + 검색(프론트 필터) + 행 선택
 * - 오른쪽: CommonCodeItemPanel (선택 그룹의 항목)
 *
 * 데이터 흐름:
 * 1) mount 시 fetchCommonCodeGroupRequest → saga → API → Redux groups
 * 2) 검색은 DB 재조회 없이 groups 를 keyword/useYn 으로 필터 (useMemo)
 * 3) 행 클릭 → selectedGroupId → 오른쪽 패널에 group 전달
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CommonCodeItemPanel from "@/components/commonCode/CommonCodeItemPanel";
import CommonCodeGroupRegisterForm from "@/components/commonCode/CommonCodeGroupRegisterForm";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Panel,
  Select,
  StatusBadge,
} from "@/components/common";
import { fetchCommonCodeGroupRequest } from "@/features/commonCode/slice/commonCodeGroupSlice";
import type { RootState } from "@/store/store";

export default function CommonCodeGroupList() {
  const dispatch = useDispatch();
  const groups = useSelector((state: RootState) => state.commonCodeGroup.groups);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);

  const [registerOpen, setRegisterOpen] = useState(false);
  /** 왼쪽에서 선택한 그룹 PK — 오른쪽 항목 패널에 전달 */
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // ----- 검색 조건 (프론트 전용, API 파라미터 아님) -----
  const [keyword, setKeyword] = useState("");
  /** "" = 전체, "Y" | "N" = 사용여부 필터 */
  const [useYnFilter, setUseYnFilter] = useState("");

  /**
   * 목록 필터
   * - groups(원본)는 Redux 에 유지
   * - keyword / useYnFilter / groups 가 바뀔 때만 다시 계산 (useMemo)
   */
  const filteredGroups = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return groups.filter((group) => {
      const matchKeyword =
        q === "" ||
        group.groupCode.toLowerCase().includes(q) ||
        group.groupName.toLowerCase().includes(q);
      const matchUseYn = useYnFilter === "" || group.useYn === useYnFilter;
      return matchKeyword && matchUseYn;
    });
  }, [groups, keyword, useYnFilter]);

  /** 선택 ID 로 원본 groups 에서 그룹 객체 찾기 (수정 모달 등에 사용) */
  const selectedGroup =
    selectedGroupId == null
      ? null
      : groups.find((g) => g.groupId === selectedGroupId) ?? null;

  // 화면 진입 시 그룹 목록 1회 조회
  useEffect(() => {
    dispatch(fetchCommonCodeGroupRequest());
  }, [dispatch]);

  /** 검색 조건만 초기화 (목록 데이터는 유지) */
  function resetGroupSearch() {
    setKeyword("");
    setUseYnFilter("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">SYSTEM</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            공통코드
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            그룹을 선택한 뒤 항목을 등록·수정합니다.
          </p>
        </div>
        <Button variant="primary" onClick={() => setRegisterOpen(true)}>
          그룹 등록
        </Button>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* ========== 왼쪽: 그룹 목록 ========== */}
        <Panel>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">코드 그룹</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                행 클릭 시 항목 패널이 열립니다
              </p>
            </div>
            {/* 필터 결과 건수 / 전체 건수 */}
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
              {filteredGroups.length}
              {filteredGroups.length !== groups.length ? ` / ${groups.length}` : ""}
            </span>
          </div>

          {/* 그룹 검색 영역 */}
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <FormField
                label="검색어"
                htmlFor="groupKeyword"
                className="min-w-[200px] flex-1"
              >
                <Input
                  id="groupKeyword"
                  value={keyword}
                  placeholder="그룹코드 / 그룹명"
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </FormField>
              <FormField label="사용여부" htmlFor="groupUseYn" className="w-36">
                <Select
                  id="groupUseYn"
                  value={useYnFilter}
                  placeholder="전체"
                  onChange={(e) => setUseYnFilter(e.target.value)}
                  options={[
                    { value: "Y", label: "사용 (Y)" },
                    { value: "N", label: "미사용 (N)" },
                  ]}
                />
              </FormField>
              <Button type="button" variant="secondary" onClick={resetGroupSearch}>
                초기화
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">그룹코드</th>
                  <th className="px-5 py-3 font-medium">그룹명</th>
                  <th className="w-28 px-5 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-20 text-center text-slate-400">
                      목록을 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-20 text-center text-slate-400">
                      {groups.length === 0
                        ? "등록된 그룹이 없습니다. 우측 상단에서 그룹을 등록하세요."
                        : "검색 조건에 맞는 그룹이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((row) => {
                    const selected = selectedGroupId === row.groupId;
                    return (
                      <tr
                        key={row.groupId}
                        onClick={() => setSelectedGroupId(row.groupId)}
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
                            {row.groupCode}
                          </span>
                        </td>
                        <td className="truncate px-5 py-3.5 text-slate-600">
                          {row.groupName}
                        </td>
                        <td className="w-28 px-5 py-3.5">
                          <StatusBadge value={row.useYn} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ========== 오른쪽: 항목 패널 ========== */}
        <CommonCodeItemPanel group={selectedGroup} />
      </div>

      {/* 그룹 등록 Modal */}
      <Modal
        open={registerOpen}
        title="공통코드 그룹 등록"
        onClose={() => setRegisterOpen(false)}
      >
        <CommonCodeGroupRegisterForm onClose={() => setRegisterOpen(false)} />
      </Modal>
    </div>
  );
}
