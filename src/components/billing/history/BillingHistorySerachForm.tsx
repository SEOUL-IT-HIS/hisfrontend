import { AppDispatch, RootState } from "@/store/store";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchBillingHistoryRequest } from "@/features/billing/history/slice";
import BillingHistorySearchList from "@/components/billing/history/BillingHistorySearchList";

type BillingHistorySearchFormProps = {
    selectedPatientId: string | null;
    onSelectPatient: (patientId: string) => void;
};

export default function BillingHistorySearchForm({
    selectedPatientId,
    onSelectPatient,
}: BillingHistorySearchFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [patientName, setPatientName] = useState("");
    const { searchList, searchStatus } = useSelector(
        (state: RootState) => state.billing.billingHistory,
    );
    const { loading, error } = searchStatus;

    const onSearch = () => {
        dispatch(searchBillingHistoryRequest({ patientName }));
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSearch();
            }}
        >
            <div>
                <input
                    type="text"
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                />
                <button type="submit">
                    Search
                </button>

                {loading 
                ? (<p>Loading...</p>) 
                : searchList.map((patient) => (
                                                <BillingHistorySearchList
                                                    key={patient.patientId}
                                                    patient={patient}
                                                    selected={selectedPatientId === patient.patientId}
                                                    onSelect={onSelectPatient}
                                                />))}
            </div>
        </form>
    );
}
