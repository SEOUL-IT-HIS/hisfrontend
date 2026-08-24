"use client"

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchVitalSignDetailRequest, deleteVitalSignRequest, updateVitalSignRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const VitalSignDetail = () => {
    const dispatch = useDispatch();
    const { vitalSignId: vitalSignIdParam }: { vitalSignId: string } = useParams();
    const vitalSignId = vitalSignIdParam;
    const vitalSign = useSelector((state: RootState) => state.inpatient.vitalsign.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.vitalsign.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.vitalsign.deleteStatus);
    const { loading, error } = useSelector((state: RootState) => state.inpatient.vitalsign.detailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    const [editForm, setEditForm] = useState({
        temperature: "",
        pulse: "",
        respiration: "",
        bpSystolic: "",
        bpDiastolic: "",
        spo2: "",
    });

    useEffect(() => {
        if (!vitalSign?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(vitalSign.admissionId));
    }, [vitalSign?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!vitalSignId) return;
        dispatch(fetchVitalSignDetailRequest(vitalSignId));
    }, [vitalSignId]);

    useEffect(() => {
        if (updateStatus.success && vitalSignId) {
            dispatch(fetchVitalSignDetailRequest(vitalSignId));
        }
    }, [updateStatus.success, vitalSignId]);

    useEffect(() => {
        if (!vitalSign) return;
        setEditForm({
            temperature: String(vitalSign.temperature),
            pulse: String(vitalSign.pulse),
            respiration: String(vitalSign.respiration),
            bpSystolic: String(vitalSign.bpSystolic),
            bpDiastolic: String(vitalSign.bpDiastolic),
            spo2: String(vitalSign.spo2),
        });
    }, [vitalSign]);

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!vitalSignId) return;
        dispatch(deleteVitalSignRequest(vitalSignId));
    };

    const handleUpdate = () => {
        if (!vitalSign) return;
        dispatch(updateVitalSignRequest({
            vitalSignId: vitalSign.vitalSignId,
            admissionId: vitalSign.admissionId,
            measuredAt: vitalSign.measuredAt,
            temperature: Number(editForm.temperature),
            pulse: Number(editForm.pulse),
            respiration: Number(editForm.respiration),
            bpSystolic: Number(editForm.bpSystolic),
            bpDiastolic: Number(editForm.bpDiastolic),
            spo2: Number(editForm.spo2),
            recorderId: vitalSign.recorderId,
        }));
    };

    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && vitalSign &&
                <div><p>환자명: {
                          admission?.admissionId === vitalSign.admissionId
                        ? (patientDetail?.patientId === admission.patientId ? patientDetail.patientName : "조회중...")
                    : "조회중..."
                    }</p>

                    <p>VitalSignId: {vitalSign.vitalSignId}</p>
                    <p>AdmissionId: {vitalSign.admissionId}</p>
                    <p>MeasuredAt: {new Date(vitalSign.measuredAt).toLocaleString()}</p>
                    <p>Temperature: {vitalSign.temperature}</p>
                    <p>Pulse: {vitalSign.pulse}</p>
                    <p>Respiration: {vitalSign.respiration}</p>
                    <p>BpSystolic: {vitalSign.bpSystolic}</p>
                    <p>BpDiastolic: {vitalSign.bpDiastolic}</p>
                    <p>Spo2: {vitalSign.spo2}</p>
                    <p>RecorderId: {vitalSign.recorderId}</p>
                    <p>CreatedAt: {new Date(vitalSign.createdAt).toLocaleString()}</p>
                    <p>UpdatedAt: {new Date(vitalSign.updatedAt).toLocaleString()}</p>

                    <button onClick={handleDelete} disabled={deleteStatus.loading}>
                        {deleteStatus.loading ? "삭제중..." : "삭제"}
                    </button>
                    {deleteStatus.error && <p>{deleteStatus.error}</p>}

                    <h3>Vital Sign 수정</h3>
                    <div>
                        <label htmlFor="temperature">체온:</label>
                        <input type="number" id="temperature" name="temperature" value={editForm.temperature} onChange={onEditChange} step="0.1" />
                    </div>
                    <div>
                        <label htmlFor="pulse">맥박:</label>
                        <input type="number" id="pulse" name="pulse" value={editForm.pulse} onChange={onEditChange} min="60" max="100" />
                    </div>
                    <div>
                        <label htmlFor="respiration">호흡수:</label>
                        <input type="number" id="respiration" name="respiration" value={editForm.respiration} onChange={onEditChange} min="12" max="20" />
                    </div>
                    <div>
                        <label htmlFor="bpSystolic">수축기 혈압:</label>
                        <input type="number" id="bpSystolic" name="bpSystolic" value={editForm.bpSystolic} onChange={onEditChange} min="0" />
                    </div>
                    <div>
                        <label htmlFor="bpDiastolic">이완기 혈압:</label>
                        <input type="number" id="bpDiastolic" name="bpDiastolic" value={editForm.bpDiastolic} onChange={onEditChange} min="0" />
                    </div>
                    <div>
                        <label htmlFor="spo2">산소포화도:</label>
                        <input type="number" id="spo2" name="spo2" value={editForm.spo2} onChange={onEditChange} step="0.1" min="0" max="100" />
                    </div>
                    <button onClick={handleUpdate} disabled={updateStatus.loading}>
                        {updateStatus.loading ? "수정중..." : "수정"}
                    </button>
                    {updateStatus.error && <p>{updateStatus.error}</p>}
                    {updateStatus.success && <p>수정 완료</p>}
                </div>
            }
        </div>
    );
}
export default VitalSignDetail;
