import { BedAssignmentDTO } from "./inpatient/bedmanagement/types";
import React from "react";
import Link from "next/link";

const BedAssignmentItem = ({ bedAssignment }: { bedAssignment: BedAssignmentDTO }) => {
    return (
        <div>
            <h3>Bed Assignment</h3>
            <p>Patient: {bedAssignment.patientName}</p>
            <p>Bed: {bedAssignment.bedNumber}</p>
            <p>Assigned Date: {bedAssignment.assignedDate}</p>
        </div>
    );
};