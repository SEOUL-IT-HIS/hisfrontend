"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  PageHeader,
  Panel,
  Select,
  StatusBadge,
} from "@/components/common";
import {
  activatePatientRequest,
  checkConversionDuplicateRequest,
  deactivatePatientRequest,
  convertTemporaryPatientRequest,
  mergeTemporaryPatientRequest,
  fetchPatientDetailRequest,
  resetPatientDeactivation,
  resetPatientActivation,
  resetConversionDuplicate,
  resetPatientDeathUpdate,
  resetPatientUpdate,
  resetTemporaryPatientConversion,
  resetTemporaryPatientMerge,
  updatePatientDeathRequest,
  updatePatientRequest,
} from "@/features/patient/slice/patientSlice";
import { getGenderLabel } from "@/features/patient/util/genderCode";
import { getPatientDisplayName } from "@/features/patient/util/patientName";
import type { AppDispatch, RootState } from "@/store/store";
import PatientSafetyPanel from "./PatientSafetyPanel";
import PatientContactPanel from "./PatientContactPanel";

type PatientDetailFormProps = {
  patientId: string;
  returnTo?: string;
};

const formatDateTime = (value: string) => value.replace("T", " ").slice(0, 19);

function getPatientListReturnTo(value: string | null) {
  if (!value) return "/reception/patientmanagement";

  try {
    const url = new URL(value, "http://localhost");
    if (url.origin === "http://localhost" && url.pathname === "/reception/patientmanagement") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Fall back to the patient list when the return URL is invalid.
  }

  return "/reception/patientmanagement";
}

const getBirthDateFromResidentRegNo = (residentRegNo: string) => {
  if (!/^\d{13}$/.test(residentRegNo)) return null;

  const typeCode = residentRegNo.charAt(6);
  const century = ["1", "2", "5", "6"].includes(typeCode)
    ? 1900
    : ["3", "4", "7", "8"].includes(typeCode)
      ? 2000
      : null;

  if (century === null) return null;

  const year = century + Number(residentRegNo.slice(0, 2));
  const month = Number(residentRegNo.slice(2, 4));
  const day = Number(residentRegNo.slice(4, 6));
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getGenderFromResidentRegNo = (residentRegNo: string) => {
  const typeCode = residentRegNo.charAt(6);
  if (["1", "3", "5", "7"].includes(typeCode)) return "01" as const;
  if (["2", "4", "6", "8"].includes(typeCode)) return "02" as const;
  return null;
};

export default function PatientDetailForm({
  patientId,
  returnTo,
}: PatientDetailFormProps) {
  const patientListReturnTo = getPatientListReturnTo(returnTo ?? null);
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [deathEditing, setDeathEditing] = useState(false);
  const [deathYn, setDeathYn] = useState<"Y" | "N">("N");
  const [deathDtm, setDeathDtm] = useState("");
  const [conversionEditing, setConversionEditing] = useState(false);
  const [conversionPatientName, setConversionPatientName] = useState("");
  const [conversionResidentRegNo, setConversionResidentRegNo] = useState("");
  const [conversionBirthDate, setConversionBirthDate] = useState("");
  const [conversionGenderCd, setConversionGenderCd] = useState<"01" | "02" | "03" | "04">("03");
  const [selectedMergeTargetId, setSelectedMergeTargetId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const {
    patientDetail,
    detailLoading,
    detailError,
    updateLoading,
    updateError,
    updateSuccess,
    deactivateLoading,
    deactivateError,
    deactivateSuccess,
    deathUpdateLoading,
    deathUpdateError,
    deathUpdateSuccess,
    temporaryConversionLoading,
    temporaryConversionError,
    temporaryConversionSuccess,
    conversionDuplicateLoading,
    conversionDuplicateError,
    conversionCandidates,
    temporaryMergeLoading,
    temporaryMergeError,
    temporaryMergeSuccess,
    activateLoading,
    activateError,
    activateSuccess,
  } = useSelector((state: RootState) => state.patient);

  const isEditing = editing && !updateSuccess;

  useEffect(() => {
    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());
    dispatch(resetPatientActivation());
    dispatch(resetPatientDeathUpdate());
    dispatch(resetTemporaryPatientConversion());
    dispatch(resetTemporaryPatientMerge());
    dispatch(resetConversionDuplicate());
    dispatch(fetchPatientDetailRequest(patientId));
  }, [dispatch, patientId]);

  const startEditing = () => {
    if (!patientDetail) {
      return;
    }

    setPatientName(patientDetail.patientName);
    setValidationError(null);
    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!patientDetail) {
      return;
    }

    setPatientName(patientDetail.patientName);
    setValidationError(null);
    dispatch(resetPatientUpdate());
    setEditing(false);
  };

  const startDeathEditing = () => {
    if (!patientDetail || patientDetail.mergedToPatientId) {
      return;
    }

    setDeathYn(patientDetail.deathYn);
    setDeathDtm(
      patientDetail.deathDtm ? patientDetail.deathDtm.slice(0, 16) : "",
    );

    dispatch(resetPatientDeathUpdate());
    setDeathEditing(true);
  };

  const cancelDeathEditing = () => {
    setDeathEditing(false);
    dispatch(resetPatientDeathUpdate());
  };

  const startTemporaryConversion = () => {
    if (!patientDetail || patientDetail.tempPatientYn !== "Y") return;

    setConversionPatientName("");
    setConversionResidentRegNo("");
    setConversionBirthDate("");
    setConversionGenderCd(patientDetail.genderCd);
    setValidationError(null);
    dispatch(resetTemporaryPatientConversion());
    dispatch(resetTemporaryPatientMerge());
    dispatch(resetConversionDuplicate());
    setSelectedMergeTargetId(null);
    setConversionEditing(true);
  };

  const cancelTemporaryConversion = () => {
    setConversionEditing(false);
    setValidationError(null);
    dispatch(resetTemporaryPatientConversion());
    dispatch(resetConversionDuplicate());
    dispatch(resetTemporaryPatientMerge());
    setSelectedMergeTargetId(null);
  };

  const checkConversionDuplicate = () => {
    if (!/^\d{13}$/.test(conversionResidentRegNo)) {
      setValidationError("Please enter all 13 digits of the resident registration number first.");
      return;
    }

    if (!getBirthDateFromResidentRegNo(conversionResidentRegNo)) {
      setValidationError("Please enter a valid resident registration number.");
      return;
    }

    setValidationError(null);
    setSelectedMergeTargetId(null);
    dispatch(
      checkConversionDuplicateRequest({
        residentRegNo: conversionResidentRegNo,
        excludePatientId: patientId,
      }),
    );
  };

  const submitTemporaryConversion = () => {
    if (!/^\d{13}$/.test(conversionResidentRegNo)) {
      setValidationError("Please enter all 13 digits of the resident registration number.");
      return;
    }

    const calculatedBirthDate = getBirthDateFromResidentRegNo(
      conversionResidentRegNo,
    );

    if (!calculatedBirthDate || calculatedBirthDate !== conversionBirthDate) {
      setValidationError("Please enter a valid resident registration number.");
      return;
    }

    if (conversionCandidates === null) {
      setValidationError("Please check the resident registration number before converting.");
      return;
    }

    if (conversionCandidates.length > 0) {
      const target = conversionCandidates.find(
        (candidate) => candidate.patientId === selectedMergeTargetId,
      );
      if (!target) {
        setValidationError("Select the existing patient to merge into.");
        return;
      }
      if (!window.confirm(
        `Merge this temporary patient into ${target.patientName} (${target.patientId})? The existing patient's information will be kept.`,
      )) return;

      setValidationError(null);
      dispatch(mergeTemporaryPatientRequest({
        patientId,
        targetPatientId: target.patientId,
        residentRegNo: conversionResidentRegNo,
      }));
      return;
    }

    const normalizedName = conversionPatientName.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setValidationError("Patient name must be between 2 and 100 characters.");
      return;
    }

    if (!window.confirm("Convert this patient to a regular patient using the entered information?")) {
      return;
    }

    setValidationError(null);
    dispatch(
      convertTemporaryPatientRequest({
        patientId,
        patientName: normalizedName,
        residentRegNo: conversionResidentRegNo,
        birthDate: conversionBirthDate,
        genderCd: conversionGenderCd,
      }),
    );
  };

  const deactivatePatient = () => {
    if (
      !patientDetail ||
      patientDetail.statusCd === "INACTIVE" ||
      deactivateLoading
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Deactivate this patient?\nAn inactive patient cannot be used for new registrations.",
    );

    if (!confirmed) {
      return;
    }

    dispatch(resetPatientUpdate());
    dispatch(resetPatientDeactivation());

    dispatch(
      deactivatePatientRequest({
        patientId,
      }),
    );
  };

  const activatePatient = () => {
    if (
      !patientDetail ||
      patientDetail.statusCd === "ACTIVE" ||
      patientDetail.deathYn === "Y" ||
      activateLoading
    ) {
      return;
    }

    if (!window.confirm("Activate this patient?\nThe patient can be used for new registrations after activation.")) {
      return;
    }

    dispatch(resetPatientActivation());
    dispatch(activatePatientRequest({ patientId }));
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPatientName = patientName.trim();

    if (
      normalizedPatientName.length < 2 ||
      normalizedPatientName.length > 100
    ) {
      setValidationError("Patient name must be between 2 and 100 characters.");
      return;
    }

    const hasChanges =
      patientDetail &&
      normalizedPatientName !== patientDetail.patientName;

    if (!hasChanges) {
      setValidationError("No patient information has changed.");
      return;
    }

    setValidationError(null);

    dispatch(
      updatePatientRequest({
        patientId,
        patientName: normalizedPatientName,
      }),
    );
  };

  const submitDeathUpdate = () => {
    if (deathYn === "Y" && !deathDtm) {
      window.alert("Please enter the date and time of death.");
      return;
    }

    if (deathYn === "Y" && new Date(deathDtm).getTime() > Date.now()) {
      window.alert("The date and time of death cannot be in the future.");
      return;
    }

    const confirmed = window.confirm(
      deathYn === "Y"
        ? "Register this patient's death information?"
        : "Clear the registered death information?",
    );

    if (!confirmed) {
      return;
    }

    dispatch(
      updatePatientDeathRequest({
        patientId,
        deathYn,
        deathDtm: deathYn === "Y" ? `${deathDtm}:00` : null,
      }),
    );
    setDeathEditing(false);
  };

  return (
    <div className="flex min-h-full flex-col gap-3 p-3">
      <PageHeader
        title="Patient Details"
        actions={
          <Link href={patientListReturnTo}>
            <Button>Back to List</Button>
          </Link>
        }
      />

      {detailLoading ? <Alert>Loading patient information...</Alert> : null}

      {detailError ? <Alert variant="error">{detailError}</Alert> : null}

      {validationError ? (
        <Alert variant="error">{validationError}</Alert>
      ) : null}

      {updateError ? <Alert variant="error">{updateError}</Alert> : null}

      {updateSuccess ? (
        <Alert variant="success">Patient information updated successfully.</Alert>
      ) : null}

      {deactivateError ? (
        <Alert variant="error">{deactivateError}</Alert>
      ) : null}

      {deactivateSuccess ? (
        <Alert variant="success">Patient deactivated successfully.</Alert>
      ) : null}

      {activateError ? <Alert variant="error">{activateError}</Alert> : null}

      {activateSuccess ? (
        <Alert variant="success">Patient activated successfully.</Alert>
      ) : null}

      {deathUpdateError ? (
        <Alert variant="error">{deathUpdateError}</Alert>
      ) : null}

      {deathUpdateSuccess ? (
        <Alert variant="success">
          {patientDetail?.deathYn === "N" && patientDetail.statusCd === "INACTIVE"
            ? "Death information has been cleared. Activate the patient status before using this patient again."
            : "Death information updated successfully."}
        </Alert>
      ) : null}

      {temporaryConversionError ? (
        <Alert variant="error">{temporaryConversionError}</Alert>
      ) : null}

      {temporaryConversionSuccess ? (
        <Alert variant="success">Patient converted to a regular patient successfully.</Alert>
      ) : null}

      {temporaryMergeError ? <Alert variant="error">{temporaryMergeError}</Alert> : null}

      {temporaryMergeSuccess ? (
        <Alert variant="success">
          Temporary patient merged into {getPatientDisplayName(
            patientDetail?.patientName,
            patientDetail?.tempPatientNo,
            patientDetail?.tempPatientYn,
          )}.{" "}
          <Link className="font-medium underline" href={`/reception/patientmanagement/${patientDetail?.patientId}`}>
            Open the regular patient record
          </Link>
        </Alert>
      ) : null}

      {patientDetail?.tempPatientYn === "Y" && !patientDetail.mergedToPatientId ? (
        <Alert>
          This is a temporary patient whose identity has not been confirmed. Convert
          the patient after identity confirmation.
        </Alert>
      ) : null}

      {patientDetail?.mergedToPatientId ? (
        <Alert>
          This temporary patient has been merged into another patient.{" "}
          <Link className="font-medium underline" href={`/reception/patientmanagement/${patientDetail.mergedToPatientId}`}>
            Open the regular patient record
          </Link>
        </Alert>
      ) : null}

      {patientDetail ? (
        <Panel>
          <form onSubmit={submitUpdate}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-800">
                  Patient Information — {getPatientDisplayName(
                    patientDetail.patientName,
                    patientDetail.tempPatientNo,
                    patientDetail.tempPatientYn,
                  )}
                </h2>
                {patientDetail.tempPatientYn === "Y" && !patientDetail.mergedToPatientId ? (
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Temporary
                  </span>
                ) : null}
                {patientDetail.deathYn === "Y" ? (
                  <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Deceased
                  </span>
                ) : null}
              </div>

              {!isEditing && !patientDetail.mergedToPatientId ? (
                <div className="flex gap-2">
                  {patientDetail.tempPatientYn === "Y" && !patientDetail.mergedToPatientId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={startTemporaryConversion}
                      disabled={temporaryConversionLoading}
                    >
                      Convert to Regular Patient
                    </Button>
                  ) : null}
                  {patientDetail.statusCd === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={deactivatePatient}
                      disabled={deactivateLoading}
                    >
                      {deactivateLoading ? "Processing..." : "Deactivate"}
                    </Button>
                  ) : patientDetail.deathYn === "N" ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={activatePatient}
                      disabled={activateLoading}
                    >
                      {activateLoading ? "Processing..." : "Activate"}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" disabled>
                      Cannot Activate Deceased Patient
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={startEditing}
                    disabled={deactivateLoading}
                  >
                    Edit
                  </Button>
                </div>
              ) : null}
            </div>

            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Patient ID"
                value={String(patientDetail.patientId)}
              />

              {isEditing ? (
                <div>
                  <dt className="text-xs font-medium text-slate-400">Patient Name</dt>

                  <dd className="mt-1">
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(event) => {
                        setPatientName(event.target.value);
                        setValidationError(null);
                      }}
                      minLength={2}
                      maxLength={100}
                      disabled={updateLoading}
                      autoFocus
                      autoComplete="name"
                    />
                  </dd>
                </div>
              ) : (
                <DetailItem
                  label="Patient Name"
                  value={getPatientDisplayName(
                    patientDetail.patientName,
                    patientDetail.tempPatientNo,
                    patientDetail.tempPatientYn,
                  )}
                />
              )}

              <div>
                <dt className="text-xs font-medium text-slate-400">
                  Patient Status
                </dt>

                <dd className="mt-1">
                  <StatusBadge
                    value={
                      patientDetail.statusCd === "ACTIVE"
                        ? "active"
                        : "inactive"
                    }
                    activeLabel="Active"
                    inactiveLabel="Inactive"
                  />
                </dd>
              </div>

              <DetailItem
                label="Death Status"
                value={patientDetail.deathYn === "Y" ? "Deceased" : "No Death Record"}
              />

              {patientDetail.tempPatientYn === "Y" && !patientDetail.mergedToPatientId ? (
                <DetailItem
                  label="Temporary Registration Reason"
                  value={patientDetail.tempRegisterReason ?? "-"}
                />
              ) : null}

              {patientDetail.deathYn === "Y" ? (
                <DetailItem
                  label="Date and Time of Death"
                  value={
                    patientDetail.deathDtm
                      ? formatDateTime(patientDetail.deathDtm)
                      : "-"
                  }
                />
              ) : null}

              <DetailItem
                label="Resident Registration Number"
                value={patientDetail.residentRegNo || "-"}
              />

              <DetailItem
                label="Gender"
                value={getGenderLabel(patientDetail.genderCd)}
              />

              <DetailItem
                label="Date of Birth"
                value={patientDetail.birthDate ?? "-"}
              />

              <DetailItem
                label="Registered At"
                value={formatDateTime(patientDetail.createdAt)}
              />

              <DetailItem
                label="Updated At"
                value={formatDateTime(patientDetail.updatedAt)}
              />
            </dl>

            {isEditing ? (
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEditing}
                  disabled={updateLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateLoading}
                >
                  {updateLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : null}
          </form>

          {patientDetail.patientId === patientId && !patientDetail.mergedToPatientId ? (
            <PatientContactPanel
              patientId={patientId}
              patientName={getPatientDisplayName(
                patientDetail.patientName,
                patientDetail.tempPatientNo,
                patientDetail.tempPatientYn,
              )}
            />
          ) : null}

          {patientDetail.patientId === patientId && !patientDetail.mergedToPatientId ? (
            <PatientSafetyPanel
              patientId={patientId}
              patientName={getPatientDisplayName(
                patientDetail.patientName,
                patientDetail.tempPatientNo,
                patientDetail.tempPatientYn,
              )}
            />
          ) : null}

          {conversionEditing && patientDetail.tempPatientYn === "Y" && !patientDetail.mergedToPatientId ? (
            <div className="border-t border-slate-200">
              <div className="px-5 py-4">
                <h2 className="text-base font-semibold text-slate-800">
                  Convert to Regular Patient
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {conversionCandidates && conversionCandidates.length > 0
                    ? "The selected regular patient will remain the representative patient. The temporary patient record will be retained as a merged record."
                    : "If no existing patient is found, this patient ID and existing records will be retained while the temporary status is removed."}
                </p>
              </div>

              <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
                <FormField
                  label="Confirmed Patient Name"
                  required={conversionCandidates === null || conversionCandidates.length === 0}
                >
                  <Input
                    value={conversionPatientName}
                    onChange={(event) => {
                      setConversionPatientName(event.target.value);
                      setValidationError(null);
                    }}
                    disabled={temporaryConversionLoading || temporaryMergeLoading}
                    minLength={conversionCandidates && conversionCandidates.length > 0 ? undefined : 2}
                    maxLength={100}
                    autoFocus
                  />
                </FormField>

                <FormField label="Resident Registration Number" required>
                  <div className="flex gap-2">
                    <Input
                      value={conversionResidentRegNo}
                      onChange={(event) => {
                        const residentRegNo = event.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 13);
                        const genderCd = getGenderFromResidentRegNo(residentRegNo);
                        setConversionResidentRegNo(residentRegNo);
                        setSelectedMergeTargetId(null);
                        setConversionBirthDate(
                          getBirthDateFromResidentRegNo(residentRegNo) ?? "",
                        );
                        if (genderCd) setConversionGenderCd(genderCd);
                        setValidationError(null);
                        dispatch(resetConversionDuplicate());
                      }}
                      disabled={
                        temporaryConversionLoading || temporaryMergeLoading || conversionDuplicateLoading
                      }
                      inputMode="numeric"
                      maxLength={13}
                      placeholder="13 digits"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 whitespace-nowrap"
                      onClick={checkConversionDuplicate}
                      disabled={
                        conversionResidentRegNo.length !== 13 ||
                        temporaryConversionLoading ||
                        temporaryMergeLoading ||
                        conversionDuplicateLoading
                      }
                    >
                      {conversionDuplicateLoading ? "Checking..." : "Check Duplicate"}
                    </Button>
                  </div>
                  {conversionCandidates?.length === 0 ? (
                    <p className="mt-1 text-sm text-emerald-600">
                      This resident registration number is available.
                    </p>
                  ) : null}
                  {conversionDuplicateError ? (
                    <p className="mt-1 text-sm text-red-600">
                      {conversionDuplicateError}
                    </p>
                  ) : null}
                </FormField>

                {conversionCandidates && conversionCandidates.length > 0 ? (
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-sm font-medium text-amber-700">
                      Existing patient found. Select the patient to merge into.
                    </p>
                    {conversionCandidates.map((candidate) => (
                      <label
                        key={candidate.patientId}
                        className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${selectedMergeTargetId === candidate.patientId ? "border-sky-500 bg-sky-50" : "border-slate-200"}`}
                      >
                        <input
                          type="radio"
                          name="temporaryPatientMergeTarget"
                          checked={selectedMergeTargetId === candidate.patientId}
                          onChange={() => {
                            setSelectedMergeTargetId(candidate.patientId);
                            setValidationError(null);
                          }}
                          disabled={temporaryMergeLoading || temporaryConversionLoading || candidate.birthDate !== conversionBirthDate}
                          className="mt-1"
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-semibold text-slate-800">
                            {candidate.patientName} · {candidate.residentRegNo}
                          </span>
                          <span className="mt-1 block text-slate-600">
                            DOB {candidate.birthDate ?? "Unknown"} · {getGenderLabel(candidate.genderCd)} · {candidate.statusCd}
                            {candidate.deathYn === "Y" ? " · Deceased" : ""}
                          </span>
                          <span className="block break-all text-xs text-slate-500">Patient ID: {candidate.patientId}</span>
                          {candidate.birthDate !== conversionBirthDate ? (
                            <span className="mt-1 block text-xs font-medium text-red-600">
                              Birth date does not match the resident registration number. Manual review is required.
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}

                <FormField
                  label="Date of Birth"
                  required
                  hint="Calculated automatically from the resident registration number."
                >
                  <Input
                    type="date"
                    value={conversionBirthDate}
                    readOnly
                    disabled={temporaryConversionLoading || temporaryMergeLoading}
                  />
                </FormField>

                <FormField label="Gender" required>
                  <Select
                    value={conversionGenderCd}
                    onChange={(event) =>
                      setConversionGenderCd(
                        event.target.value as "01" | "02" | "03" | "04",
                      )
                    }
                    options={[
                      { value: "01", label: "Male" },
                      { value: "02", label: "Female" },
                      { value: "03", label: "Unknown" },
                      { value: "04", label: "Other" },
                    ]}
                    disabled={temporaryConversionLoading || temporaryMergeLoading}
                  />
                </FormField>

                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={cancelTemporaryConversion}
                    disabled={temporaryConversionLoading || temporaryMergeLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={submitTemporaryConversion}
                    disabled={
                      temporaryConversionLoading ||
                      temporaryMergeLoading ||
                      conversionDuplicateLoading ||
                      conversionCandidates === null ||
                      (conversionCandidates.length > 0 && !selectedMergeTargetId)
                    }
                  >
                    {temporaryMergeLoading
                      ? "Merging..."
                      : temporaryConversionLoading
                        ? "Converting..."
                        : conversionCandidates && conversionCandidates.length > 0
                          ? "Merge into Selected Patient"
                          : "Convert"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-slate-800">
                Death Information
              </h2>

              {!deathEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startDeathEditing}
                  disabled={deathUpdateLoading || !!patientDetail.mergedToPatientId}
                >
                  Edit Death Information
                </Button>
              ) : null}
            </div>

            <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
              {deathEditing ? (
                <>
                  <FormField label="Death Status" required>
                    <Select
                      value={deathYn}
                      options={[
                        { value: "N", label: "No Death Record" },
                        { value: "Y", label: "Deceased" },
                      ]}
                      onChange={(event) => {
                        const value = event.target.value as "Y" | "N";

                        setDeathYn(value);

                        if (value === "N") {
                          setDeathDtm("");
                        }
                      }}
                      disabled={deathUpdateLoading}
                    />
                  </FormField>

                  <FormField label="Date and Time of Death" required={deathYn === "Y"}>
                    <Input
                      type="datetime-local"
                      value={deathDtm}
                      onChange={(event) => setDeathDtm(event.target.value)}
                      disabled={deathYn === "N" || deathUpdateLoading}
                    />
                  </FormField>

                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelDeathEditing}
                      disabled={deathUpdateLoading}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={submitDeathUpdate}
                      disabled={deathUpdateLoading}
                    >
                      {deathUpdateLoading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <DetailItem
                    label="Death Status"
                    value={
                      patientDetail.deathYn === "Y" ? "Deceased" : "No Death Record"
                    }
                  />

                  <DetailItem
                    label="Date and Time of Death"
                    value={
                      patientDetail.deathDtm
                        ? formatDateTime(patientDetail.deathDtm)
                        : "-"
                    }
                  />
                </>
              )}
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>

      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
