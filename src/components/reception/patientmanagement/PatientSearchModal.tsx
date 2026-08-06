"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  Input,
  Modal,
  type DataTableColumn,
} from "@/components/common";
import {
  searchPatientsRequest,
  clearPatientSearch,
  selectPatientSearchResults,
  selectPatientSearchLoading,
  selectPatientSearchError,
} from "@/features/reception/patientmanagement/slice";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import type { AppDispatch } from "@/store/store";

type PatientSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: PatientSearchItem) => void;
};

/**
 * 환자 목록 조회 모달
 * - 접수등록 폼의 [환자검색] 버튼으로 열린다.
 * - 환자관리 서비스 API(features/reception/patientmanagement)를 통해 검색한다.
 */
export default function PatientSearchModal({
  open,
  onClose,
  onSelect,
}: PatientSearchModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [keyword, setKeyword] = useState("");
  const results = useSelector(selectPatientSearchResults);
  const loading = useSelector(selectPatientSearchLoading);
  const error = useSelector(selectPatientSearchError);

  function handleSearch() {
    dispatch(searchPatientsRequest({ keyword: keyword.trim() }));
  }

  function handleSelect(patient: PatientSearchItem) {
    onSelect(patient);
    handleClose();
  }

  function handleClose() {
    setKeyword("");
    dispatch(clearPatientSearch());
    onClose();
  }

  const columns: DataTableColumn<PatientSearchItem>[] = [
    { key: "patientName", header: "환자명", render: (p) => p.patientName },
    { key: "birthDate", header: "생년월일", render: (p) => p.birthDate },
    { key: "genderCode", header: "성별", render: (p) => p.genderCode },
    { key: "phoneNumber", header: "연락처", render: (p) => p.phoneNumber },
    {
      key: "action",
      header: "",
      render: (p) => (
        <Button variant="secondary" onClick={() => handleSelect(p)}>
          선택
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="환자 검색"
      onClose={handleClose}
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={keyword}
            placeholder="환자명 또는 등록번호를 입력하세요"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button type="button" variant="primary" onClick={handleSearch}>
            검색
          </Button>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <DataTable
          columns={columns}
          rows={results}
          rowKey={(p) => p.patientId}
          loading={loading}
          loadingMessage="환자를 검색하는 중입니다..."
          emptyMessage="검색된 환자가 없습니다."
        />
      </div>
    </Modal>
  );
}
