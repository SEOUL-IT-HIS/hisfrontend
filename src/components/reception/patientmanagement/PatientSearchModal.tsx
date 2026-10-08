"use client";

import { useEffect, useState } from "react";
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
import type { GenderCd } from "@/features/patient/type/patientType";
import { getGenderLabel } from "@/features/patient/util/genderCode";
import { fetchPatientContactListApi } from "@/features/patient/api/patientContactApi";
import type { AppDispatch } from "@/store/store";

/**
 * 전화번호는 화면에 그대로 보이지 않게 가운데 번호를 가려서 보여준다. (저장 형식이 숫자만이든 하이픈이 있든 같은 모양)
 * - 11자리(01012345678, 010-1234-5678) → 010-****-5678
 * - 10자리(0101234567) → 010-***-4567
 * - 그 밖의 길이는 앞 3자리와 뒤 4자리만 남기고 가린다.
 */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  if (digits.length > 7) return digits.slice(0, 3) + "*".repeat(digits.length - 7) + digits.slice(-4);
  return "****";
}

/** 한 번에 연락처를 조회할 최대 환자 수 — 검색 결과가 많아도 요청이 폭주하지 않게 한다 */
const PHONE_LOOKUP_LIMIT = 50;

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
  // 연락처는 검색 목록 API 에 없어서 환자별 연락처 API 로 따로 조회한다 (patientId → 대표 전화번호, 없으면 null)
  const [phones, setPhones] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (results.length === 0) return;
    let cancelled = false;

    async function loadPhones() {
      const ids = [...new Set(results.map((p) => p.patientId))].slice(0, PHONE_LOOKUP_LIMIT);
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const contacts = await fetchPatientContactListApi({ patientId: id });
            // 사용 중인 연락처 중 대표(primary)를 우선, 없으면 전화번호가 있는 첫 번째
            const usable = contacts.filter((c) => c.activeYn !== "N" && c.phoneNo);
            const picked = usable.find((c) => c.primaryYn === "Y") ?? usable[0];
            return [id, picked?.phoneNo ?? null] as const;
          } catch {
            // 연락처 조회가 실패해도 환자 검색은 계속 쓸 수 있어야 한다 — 빈칸("-")으로 둔다.
            return [id, null] as const;
          }
        }),
      );
      if (!cancelled) setPhones((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }

    void loadPhones();
    return () => {
      cancelled = true;
    };
  }, [results]);

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

  /** 이 환자의 연락처를 아직 불러오는 중인지 — 조회 개수 제한 안에 있고 결과가 아직 없을 때 */
  function isPhoneLoading(patientId: string) {
    const ids = [...new Set(results.map((p) => p.patientId))].slice(0, PHONE_LOOKUP_LIMIT);
    return ids.includes(patientId);
  }

  const columns: DataTableColumn<PatientSearchItem>[] = [
    { key: "patientName", header: "Patient Name", render: (p) => p.patientName },
    { key: "birthDate", header: "Date of Birth", render: (p) => p.birthDate },
    // 코드(01, 02…) 대신 환자 목록 화면과 같은 이름(Male/Female/Unknown/Other)으로 보여준다
    { key: "genderCd", header: "Gender", render: (p) => getGenderLabel(p.genderCd as GenderCd) },
    {
      key: "phoneNo",
      header: "Phone",
      // 아직 불러오는 중이면 "…", 연락처가 없거나 조회 개수 제한을 넘으면 "-"
      render: (p) => {
        if (p.patientId in phones) {
          const phone = phones[p.patientId];
          return phone ? maskPhone(phone) : "-";
        }
        return isPhoneLoading(p.patientId) ? "…" : "-";
      },
    },
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
      maxWidthClassName="max-w-3xl"
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
