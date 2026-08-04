"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { fetchPatientListApi } from "@/features/patient/api/patientApi";
import type { PatientListItem } from "@/features/patient/type/patientType";
import { resolveSurgeryMessage } from "@/features/surgery/messages";
import {
  fetchAvailableRoomsRequest,
  selectAvailableRooms,
} from "@/features/surgery/room/slice";
import {
  registerEmergencySurgeryRequest,
  registerSurgeryRequest,
  selectScheduleError,
  selectScheduleSaving,
} from "@/features/surgery/schedule/slice";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

type FieldErrors = {
  patientId?: string;
  surgeonId?: string;
  surgeryDt?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50";

/**
 * 수술 요청 등록 폼 — <b>임시 대행 화면</b> (SL2-36 / SL2-44)
 *
 * <p>원래 이 화면은 수술 서비스의 것이 아니다. 일반 수술은 진료가, 응급 수술은 응급실이
 * 요청해야 한다(§21.1 — 수술은 다른 서비스의 업무를 대신하지 않는다). 다만 features/outpatient
 * 와 features/emergency 에 아직 요청 화면이 없어, 그때까지 데이터를 만들 수단으로 둔다.
 * 두 서비스가 각자 화면을 만들면 이 화면은 지우고 배정·진행 관리만 남긴다.</p>
 *
 * <p>일반이든 응급이든 '요청접수(00)'로 생성되고, 수술실 담당자가 배정 화면에서 수술실을
 * 잡아야 '예약(01)'이 된다. 차이는 응급 여부뿐이며 응급 건이 배정 대기 목록 위로 올라온다.</p>
 *
 * <p>수술실 선택칸을 남겨둔 이유 — 요청자가 희망 수술실을 적을 수 있게 하되, 확정과
 * 가용성 검증은 배정 시점에 백엔드가 수행한다.</p>
 *
 * <p>수술실은 사용가능 목록에서, 환자는 환자 서비스 목록에서 선택한다.
 * 프론트가 각 서비스 API 를 직접 호출한다(§2.1 — 수술 백엔드가 대신 조회하면 BFF 가 되어
 * §21.1 위반). 선택 결과는 식별자만 수술 서비스로 보내고 이름은 저장하지 않는다(§14.1).</p>
 *
 * <p>집도의는 직원 모듈(features/emp)의 목록에서 선택한다. 직원 데이터는 admin-service
 * 소유라 수술이 자체 조회를 두지 않는다(§21.1).</p>
 */
export default function ScheduleRegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const saving = useSelector(selectScheduleSaving);
  const error = useSelector(selectScheduleError);
  const availableRooms = useSelector(selectAvailableRooms);

  const [patientId, setPatientId] = useState("");
  const [surgeonId, setSurgeonId] = useState("");
  const [surgeryDt, setSurgeryDt] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [surgeryName, setSurgeryName] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // 환자 선택 목록. 환자 서비스가 소유한 데이터라 slice 를 거치지 않고 직접 조회한다
  // (수술 slice 에 타 서비스 상태를 두면 서비스 간 상태 결합이 생긴다 — §10.1)
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [patientLoadError, setPatientLoadError] = useState("");
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeLoadError, setEmployeeLoadError] = useState("");

  // 수술실 선택 목록 — 사용가능(01) 상태만 받아온다
  useEffect(() => {
    dispatch(fetchAvailableRoomsRequest());
  }, [dispatch]);

  useEffect(() => {
    let ignore = false;
    fetchPatientListApi()
      .then((list) => {
        if (!ignore) setPatients(list);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setPatientLoadError(
          err instanceof Error ? err.message : "환자 목록 조회에 실패했습니다.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 집도의 선택 목록 — admin-service 직원 조회
  useEffect(() => {
    let ignore = false;
    fetchEmpApi()
      .then((list) => {
        if (!ignore) setEmployees(list);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setEmployeeLoadError(
          err instanceof Error ? err.message : "직원 목록 조회에 실패했습니다.",
        );
      });
    return () => {
      ignore = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!patientId) nextErrors.patientId = "환자를 선택해주세요.";
    if (!surgeonId) nextErrors.surgeonId = "집도의를 선택해주세요.";
    if (!surgeryDt) nextErrors.surgeryDt = "수술일을 선택해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const request = {
      patientId,
      surgeonId,
      // <input type="date"> 값이 이미 yyyy-MM-dd 라 그대로 보낸다(§14.2 `_dt`)
      surgeryDt,
      emergencyYn: emergency ? ("Y" as const) : ("N" as const),
      roomCode: roomCode || null,
      surgeryName: surgeryName.trim() || null,
    };

    // 상태·응급여부는 보내지 않는다 — 호출한 엔드포인트가 서버에서 결정한다.
    // (일반 POST 는 emergencyYn=N, /emergency 는 Y 로 강제)
    dispatch(
      emergency
        ? registerEmergencySurgeryRequest(request)
        : registerSurgeryRequest(request),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="patientId" className="text-sm text-slate-700">
          환자
        </label>
        <select
          id="patientId"
          className={inputClass}
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          disabled={saving}
        >
          <option value="">환자 선택</option>
          {patients.map((patient) => (
            // patient-service 는 patientId 가 number, 수술은 VARCHAR2(36) 문자열이라
            // 문자열로 변환해 보낸다
            <option key={patient.patientId} value={String(patient.patientId)}>
              {patient.patientName} ({patient.birthDate})
            </option>
          ))}
        </select>
        {patientLoadError && (
          <p className="text-xs text-red-600">{patientLoadError}</p>
        )}
        {errors.patientId && (
          <p className="text-xs text-red-600">{errors.patientId}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="surgeonId" className="text-sm text-slate-700">
          집도의
        </label>
        <select
          id="surgeonId"
          className={inputClass}
          value={surgeonId}
          onChange={(e) => setSurgeonId(e.target.value)}
          disabled={saving}
        >
          <option value="">집도의 선택</option>
          {employees.map((employee) => (
            // admin-service 는 empId 가 number, 수술은 VARCHAR2(36) 문자열이라 변환해 보낸다
            <option key={employee.empId} value={String(employee.empId)}>
              {employee.empName} ({employee.empNo})
            </option>
          ))}
        </select>
        {employeeLoadError && (
          <p className="text-xs text-red-600">{employeeLoadError}</p>
        )}
        {errors.surgeonId && (
          <p className="text-xs text-red-600">{errors.surgeonId}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="surgeryDt" className="text-sm text-slate-700">
          수술일
        </label>
        <input
          id="surgeryDt"
          type="date"
          className={inputClass}
          value={surgeryDt}
          onChange={(e) => setSurgeryDt(e.target.value)}
          disabled={saving}
        />
        {errors.surgeryDt && (
          <p className="text-xs text-red-600">{errors.surgeryDt}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="roomCode" className="text-sm text-slate-700">
          수술실
        </label>
        <select
          id="roomCode"
          className={inputClass}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={saving}
        >
          <option value="">선택 안 함</option>
          {availableRooms.map((room) => (
            <option key={room.roomCode} value={room.roomCode}>
              {room.roomName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="surgeryName" className="text-sm text-slate-700">
          수술명
        </label>
        <input
          id="surgeryName"
          className={inputClass}
          value={surgeryName}
          onChange={(e) => setSurgeryName(e.target.value)}
          disabled={saving}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={emergency}
          onChange={(e) => setEmergency(e.target.checked)}
          disabled={saving}
        />
        응급 수술
      </label>

      {error && (
        <p className="text-sm text-red-600">{resolveSurgeryMessage(error)}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-lg bg-sky-500 px-4 text-white disabled:bg-slate-300"
      >
        {saving ? "등록 중…" : "등록"}
      </button>
    </form>
  );
}
