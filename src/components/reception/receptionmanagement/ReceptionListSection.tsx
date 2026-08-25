"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  Input,
  PageHeader,
  SearchBar,
  type DataTableColumn,
} from "@/components/common";
import {
  fetchReceptionListRequest,
  selectReceptionList,
  selectReceptionListLoading,
  selectReceptionListError,
} from "@/features/reception/receptionmanagement/slice";
import type { ReceptionListItem } from "@/features/reception/receptionmanagement/types";
import type { AppDispatch } from "@/store/store";

const RECEPTION_TYPE_LABEL: Record<string, string> = {
  INITIAL: "초진",
  REVISIT: "재진",
};

type ReceptionListSectionProps = {
  onSelectReception: (receptionId: string) => void;
};

/**
 * 접수 목록 조회
 * - 접수 등록 성공 시 saga 에서 자동으로 재조회한다.
 */
export default function ReceptionListSection({
  onSelectReception,
}: ReceptionListSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const list = useSelector(selectReceptionList);
  const listLoading = useSelector(selectReceptionListLoading);
  const listError = useSelector(selectReceptionListError);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    dispatch(fetchReceptionListRequest());
  }, [dispatch]);

  function handleSearch() {
    dispatch(
      fetchReceptionListRequest({ keyword: keyword.trim() || undefined }),
    );
  }

  function handleReset() {
    setKeyword("");
    dispatch(fetchReceptionListRequest());
  }

  const columns: DataTableColumn<ReceptionListItem>[] = [
    {
      key: "receptionDate",
      header: "접수일시",
      render: (r) => r.receptionDate,
    },
    { key: "patientName", header: "환자명", render: (r) => r.patientName },
    { key: "deptName", header: "진료과", render: (r) => r.deptName },
    { key: "doctorName", header: "담당의", render: (r) => r.doctorName },
    {
      key: "receptionType",
      header: "구분",
      render: (r) => RECEPTION_TYPE_LABEL[r.receptionType] ?? r.receptionType,
    },
    { key: "status", header: "상태", render: (r) => r.status },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button
          variant="secondary"
          onClick={() => onSelectReception(r.receptionId)}
        >
          상세
        </Button>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PageHeader title="접수 목록" description="접수된 환자 목록입니다." />

      <SearchBar onSearch={handleSearch} onReset={handleReset}>
        <Input
          value={keyword}
          placeholder="환자명으로 검색"
          onChange={(e) => setKeyword(e.target.value)}
        />
      </SearchBar>

      {listError ? <Alert variant="error">{listError}</Alert> : null}

      <DataTable
        columns={columns}
        rows={list}
        rowKey={(r) => r.receptionId}
        loading={listLoading}
        loadingMessage="접수 목록을 불러오는 중입니다..."
        emptyMessage="접수된 내역이 없습니다."
      />
    </div>
  );
}
