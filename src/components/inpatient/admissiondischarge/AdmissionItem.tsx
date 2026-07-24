import { AdmissionDTO } from "./types";
import React from "react";
import Link from "next/link";

const AdmissionItem = ({ admission }: { admission: AdmissionDTO }) => {
    return (
        <div>
            <h3>Admission</h3>
            <p>AdmissionId: {admission.admissionId}</p>
            <p>AdmissionDeptId: {admission.admissionDeptId}</p>
            <p>AdmissionRoute: {admission.admissionRoute}</p>
            <p>AdmissionDate: {admission.admissionDate}</p>
            <p>PatientId: {admission.patientId}</p>
            <p>DoctorId: {admission.doctorId}</p>
            <p>Status: {admission.status}</p>
            <p>CreatedAt: {admission.createdAt}</p>
            <p>UpdatedAt: {admission.updatedAt}</p>
        </div>
    );
};