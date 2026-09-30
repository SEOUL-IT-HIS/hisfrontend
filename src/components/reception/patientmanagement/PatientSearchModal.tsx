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
  const [patientName, setPatientName] = useState("");
  const results = useSelector(selectPatientSearchResults);
  const loading = useSelector(selectPatientSearchLoading);
  const error = useSelector(selectPatientSearchError);

  function handleSearch() {
    dispatch(searchPatientsRequest({ patientName: patientName.trim() }));
  }

  function handleSelect(patient: PatientSearchItem) {
    onSelect(patient);
    handleClose();
  }

  function handleClose() {
    setPatientName("");
    dispatch(clearPatientSearch());
    onClose();
  }

  const columns: DataTableColumn<PatientSearchItem>[] = [
    { key: "patientName", header: "Patient Name", render: (p) => p.patientName },
    { key: "birthDate", header: "Date of Birth", render: (p) => p.birthDate },
    { key: "genderCd", header: "Gender", render: (p) => p.genderCd },
    {
      key: "action",
      header: "",
      render: (p) => (
        <Button variant="secondary" onClick={() => handleSelect(p)}>
          Select
        </Button>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="Search Patient"
      onClose={handleClose}
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={patientName}
            placeholder="Enter patient name"
            onChange={(e) => setPatientName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button type="button" variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <DataTable
          columns={columns}
          rows={results}
          rowKey={(p) => p.patientId}
          loading={loading}
          loadingMessage="Searching for patients..."
          emptyMessage="No patients found."
        />
      </div>
    </Modal>
  );
}
