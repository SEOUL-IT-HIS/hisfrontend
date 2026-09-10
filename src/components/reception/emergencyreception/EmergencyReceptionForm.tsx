"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, FormActions, FormField, Input, Select } from "@/components/common";
import {
  registerEmergencyReceptionRequest,
  selectEmergencyRegisterLoading,
  selectEmergencyRegisterError,
  selectEmergencyRegisterSuccessCount,
} from "@/features/reception/emergencyreception/slice";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import type { AppDispatch } from "@/store/store";

/**
 * 의식상태는 admin-service 공통코드에 해당 그룹이 없어 프론트에 직접 고정 옵션으로 둔다.
 * (요청사항 12: 없으면 새 백엔드 API를 만들지 말고 프론트 Select 로 구현)
 */
const CONSCIOUSNESS_OPTIONS = [
  { value: "ALERT", label: "Alert" },
  { value: "VERBAL", label: "Verbal" },
  { value: "PAIN", label: "Pain" },
  { value: "SEMICOMA", label: "Semicoma" },
  { value: "UNRESPONSIVE", label: "Unresponsive" },
];

type FieldErrors = {
  patient?: string;
  deptId?: string;
  ktasLevel?: string;
  visitMethod?: string;
  chiefComplaint?: string;
  consciousness?: string;
};

type EmergencyReceptionFormProps = {
  selectedPatient: PatientSearchItem | null;
  onOpenPatientSearch: () => void;
  onClearPatient: () => void;
};

/**
 * 응급 접수 등록 폼
 * - reception 도메인의 ReceptionRegisterForm 과 동일한 패턴(등록 성공 시 key 리마운트로 초기화)을 따른다.
 */
export default function EmergencyReceptionForm(
  props: EmergencyReceptionFormProps,
) {
  const resetSignal = useSelector(selectEmergencyRegisterSuccessCount);
  const { onClearPatient } = props;
  /** onClearPatient 는 부모가 넘기는 인라인 함수라 렌더될 때마다 레퍼런스가 바뀐다.
   * resetSignal 값 자체가 실제로 바뀐 시점만 추적해서 그때만 초기화한다. */
  const lastResetSignal = useRef(resetSignal);

  useEffect(() => {
    if (resetSignal === lastResetSignal.current) return;
    lastResetSignal.current = resetSignal;
    onClearPatient();
  }, [resetSignal, onClearPatient]);

  return <EmergencyReceptionFormFields key={resetSignal} {...props} />;
}

function EmergencyReceptionFormFields({
  selectedPatient,
  onOpenPatientSearch,
  onClearPatient,
}: EmergencyReceptionFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const departments = useCommonCodeOptions("DEPT_CD");
  const ktasOptions = useCommonCodeOptions("TRIAGE_CD");
  const visitMethodOptions = useCommonCodeOptions("VISIT_FORM_CD");
  const registerLoading = useSelector(selectEmergencyRegisterLoading);
  const registerError = useSelector(selectEmergencyRegisterError);

  const [deptId, setDeptId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [ktasLevel, setKtasLevel] = useState("");
  const [visitMethod, setVisitMethod] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [consciousness, setConsciousness] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleReset() {
    setDeptId("");
    setDoctorId("");
    setKtasLevel("");
    setVisitMethod("");
    setChiefComplaint("");
    setConsciousness("");
    setMemo("");
    setErrors({});
    onClearPatient();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!selectedPatient) nextErrors.patient = "Please search for and select a patient.";
    if (!deptId) nextErrors.deptId = "Please select a department.";
    if (!ktasLevel) nextErrors.ktasLevel = "Please select a KTAS level.";
    if (!visitMethod) nextErrors.visitMethod = "Please select a visit method.";
    if (!chiefComplaint.trim()) nextErrors.chiefComplaint = "Please enter the chief complaint.";
    if (!consciousness) nextErrors.consciousness = "Please select a consciousness level.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedPatient) return;

    dispatch(
      registerEmergencyReceptionRequest({
        patientId: selectedPatient.patientId,
        deptId,
        doctorId,
        memo: memo.trim(),
        ktasLevel: Number(ktasLevel),
        visitMethod,
        chiefComplaint: chiefComplaint.trim(),
        consciousness,
      }),
    );
  }

  return (
    <div className="space-y-4">
      {registerError ? <Alert variant="error">{registerError}</Alert> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Patient" required>
          <div className="flex gap-2">
            <Input
              readOnly
              value={
                selectedPatient
                  ? `${selectedPatient.patientName} (${selectedPatient.patientId})`
                  : ""
              }
              placeholder="Select a patient using the Search Patient button"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPatientSearch}
            >
              Search Patient
            </Button>
          </div>
          {errors.patient && (
            <p className="text-xs text-rose-600">{errors.patient}</p>
          )}
        </FormField>

        <FormField label="Department" required htmlFor="emgDeptId">
          <Select
            id="emgDeptId"
            value={deptId}
            placeholder={departments.loading ? "Loading..." : "Select"}
            onChange={(e) => setDeptId(e.target.value)}
            options={departments.options}
            disabled={departments.loading}
          />
          {departments.error ? (
            <span className="text-xs text-rose-500">{departments.error}</span>
          ) : null}
          {errors.deptId && (
            <p className="text-xs text-rose-600">{errors.deptId}</p>
          )}
        </FormField>

        {/* admin-service에 의사 role이 아직 없어 목록 조회가 안 되는 동안은 직접 입력 (reception 도메인과 동일) */}
        <FormField label="Doctor" htmlFor="emgDoctorId">
          <Input
            id="emgDoctorId"
            value={doctorId}
            placeholder="Enter doctor ID"
            onChange={(e) => setDoctorId(e.target.value)}
          />
        </FormField>

        <FormField label="KTAS Level" required htmlFor="emgKtasLevel">
          <Select
            id="emgKtasLevel"
            value={ktasLevel}
            placeholder={ktasOptions.loading ? "Loading..." : "Select"}
            onChange={(e) => setKtasLevel(e.target.value)}
            options={ktasOptions.options.map((opt) => ({
              value: String(Number(opt.value)),
              label: opt.label,
            }))}
            disabled={ktasOptions.loading}
          />
          {ktasOptions.error ? (
            <span className="text-xs text-rose-500">{ktasOptions.error}</span>
          ) : null}
          {errors.ktasLevel && (
            <p className="text-xs text-rose-600">{errors.ktasLevel}</p>
          )}
        </FormField>

        <FormField label="Visit Method" required htmlFor="emgVisitMethod">
          <Select
            id="emgVisitMethod"
            value={visitMethod}
            placeholder={visitMethodOptions.loading ? "Loading..." : "Select"}
            onChange={(e) => setVisitMethod(e.target.value)}
            options={visitMethodOptions.options}
            disabled={visitMethodOptions.loading}
          />
          {visitMethodOptions.error ? (
            <span className="text-xs text-rose-500">{visitMethodOptions.error}</span>
          ) : null}
          {errors.visitMethod && (
            <p className="text-xs text-rose-600">{errors.visitMethod}</p>
          )}
        </FormField>

        <FormField label="Chief Complaint" required htmlFor="emgChiefComplaint">
          <textarea
            id="emgChiefComplaint"
            value={chiefComplaint}
            placeholder="Enter symptoms (e.g., chest pain)"
            onChange={(e) => setChiefComplaint(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          {errors.chiefComplaint && (
            <p className="text-xs text-rose-600">{errors.chiefComplaint}</p>
          )}
        </FormField>

        <FormField label="Consciousness" required htmlFor="emgConsciousness">
          <Select
            id="emgConsciousness"
            value={consciousness}
            placeholder="Select"
            onChange={(e) => setConsciousness(e.target.value)}
            options={CONSCIOUSNESS_OPTIONS}
          />
          {errors.consciousness && (
            <p className="text-xs text-rose-600">{errors.consciousness}</p>
          )}
        </FormField>

        <FormField label="Reception Memo" htmlFor="emgMemo">
          <textarea
            id="emgMemo"
            value={memo}
            placeholder="Enter a memo"
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </FormField>

        <FormActions
          onCancel={handleReset}
          cancelLabel="Reset"
          submitLabel="Register Emergency Reception"
          loadingLabel="Registering…"
          loading={registerLoading}
        />
      </form>
    </div>
  );
}
