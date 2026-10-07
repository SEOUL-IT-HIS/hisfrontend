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
import { checkActiveEmergencyReception } from "@/features/reception/emergencyreception/api";
import type {
  ActiveEmergencyReception,
  EmergencyReceptionRequest,
} from "@/features/reception/emergencyreception/types";
import DuplicateActiveReceptionModal from "./DuplicateActiveReceptionModal";
import type { PatientSearchItem } from "@/features/reception/patientmanagement/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useDeptDoctorOptions } from "@/features/reception/receptionmanagement/useDeptDoctorOptions";
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
  doctorId?: string;
  visitMethod?: string;
  chiefComplaint?: string;
  consciousness?: string;
};

type EmergencyReceptionFormProps = {
  selectedPatient: PatientSearchItem | null;
  onOpenPatientSearch: () => void;
  onOpenPatientRegister: () => void;
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
  onOpenPatientRegister,
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
  const doctors = useDeptDoctorOptions(deptId);
  const [ktasLevel, setKtasLevel] = useState("");
  const [visitMethod, setVisitMethod] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [consciousness, setConsciousness] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  /** 중복접수 사전확인 호출 중인지 — 이 동안 제출 버튼을 "Checking…" 으로 바꾼다 */
  const [activeCheckLoading, setActiveCheckLoading] = useState(false);
  /** 경고 모달에 떠 있는, 아직 실제로 등록하지 않은 요청. null 이면 모달이 닫힌 상태. */
  const [pendingRequest, setPendingRequest] = useState<EmergencyReceptionRequest | null>(null);
  const [duplicateReceptions, setDuplicateReceptions] = useState<ActiveEmergencyReception[]>([]);

  function handleContinueDespiteDuplicate() {
    if (!pendingRequest) return;
    dispatch(registerEmergencyReceptionRequest(pendingRequest));
    setPendingRequest(null);
  }

  function handleCancelDuplicateWarning() {
    setPendingRequest(null);
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!selectedPatient) nextErrors.patient = "Please search for and select a patient.";
    if (!deptId) nextErrors.deptId = "Please select a department.";
    // RECEPTION.DOCTOR_ID 가 NOT NULL 이라 응급도 담당의 필수
    if (!doctorId) nextErrors.doctorId = "Please select a doctor.";
    if (!visitMethod) nextErrors.visitMethod = "Please select a visit method.";
    if (!chiefComplaint.trim()) nextErrors.chiefComplaint = "Please enter the chief complaint.";
    if (!consciousness) nextErrors.consciousness = "Please select a consciousness level.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !selectedPatient) return;

    const request: EmergencyReceptionRequest = {
      patientId: selectedPatient.patientId,
      deptId,
      doctorId,
      memo: memo.trim(),
      // KTAS 는 선택값 — 고르지 않으면 null 로 보낸다
      ktasLevel: ktasLevel ? Number(ktasLevel) : null,
      visitMethod,
      chiefComplaint: chiefComplaint.trim(),
      consciousness,
    };

    // 등록 전에 같은 환자의 진행 중(미퇴실) 응급접수가 있는지 먼저 확인한다.
    // 이 확인 자체가 실패해도(reception-service 장애 등) 경고 없이 그대로 등록을 진행한다(fail-open).
    setActiveCheckLoading(true);
    try {
      const result = await checkActiveEmergencyReception(selectedPatient.patientId);
      if (result.hasActiveReception) {
        setDuplicateReceptions(result.activeReceptions);
        setPendingRequest(request);
        return;
      }
    } catch {
      // fail-open: 확인에 실패해도 경고 없이 그대로 등록을 진행한다.
    } finally {
      setActiveCheckLoading(false);
    }

    dispatch(registerEmergencyReceptionRequest(request));
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
                  ? selectedPatient.patientName
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
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenPatientRegister}
            >
              Register Patient
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
            onChange={(e) => {
              setDeptId(e.target.value);
              // 진료과가 바뀌면 이전 과의 의사 선택은 무효
              setDoctorId("");
            }}
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

        {/* 외래 접수폼과 동일: 진료과 소속 의사만 보여준다. 응급도 담당의 필수 */}
        <FormField label="Doctor" required htmlFor="emgDoctorId">
          <Select
            id="emgDoctorId"
            value={doctorId}
            placeholder={
              !deptId
                ? "Select a department first"
                : doctors.loading
                  ? "Loading..."
                  : doctors.options.length === 0
                    ? "No doctors in this department"
                    : "Select"
            }
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.options}
            disabled={!deptId || doctors.loading}
          />
          {doctors.error ? (
            <span className="text-xs text-rose-500">{doctors.error}</span>
          ) : null}
          {errors.doctorId && (
            <p className="text-xs text-rose-600">{errors.doctorId}</p>
          )}
        </FormField>

        <FormField label="KTAS Level" htmlFor="emgKtasLevel">
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
          loadingLabel={activeCheckLoading ? "Checking…" : "Registering…"}
          loading={registerLoading || activeCheckLoading}
        />
      </form>

      <DuplicateActiveReceptionModal
        open={pendingRequest !== null}
        activeReceptions={duplicateReceptions}
        onContinue={handleContinueDespiteDuplicate}
        onCancel={handleCancelDuplicateWarning}
      />
    </div>
  );
}
