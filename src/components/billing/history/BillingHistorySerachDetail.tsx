import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchBillingHistoryDetailRequest } from "@/features/billing/history/slice";

type BillingHistorySearchDetailProps = {
    patientId: string | null;
};

const BillingHistorySearchDetail = ({ patientId }: BillingHistorySearchDetailProps) => {
    
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, detail } = useSelector(
        (state: RootState) => ({
            loading: state.billing.billingHistory.detailStatus.loading,
            error: state.billing.billingHistory.detailStatus.error,
            detail: state.billing.billingHistory.detail,
        }),
        shallowEqual,
    ); // 진료비 상세조회 Redux State

    useEffect(() => {
        if (!patientId) return;
        dispatch(fetchBillingHistoryDetailRequest(patientId));
    }, [patientId, dispatch]);

    if (patientId === null) {
        return (
            <div>
                Please select a patient.
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    <div>
                        <a>{detail[0]?.patientName}</a>
                    </div>
                    {detail.map((item) => (
                        <div key={item.billingId}>
                            <label>{item.billingType}</label>
                            <label>{item.paymentAmount}</label>
                            <label>{item.paymentMethod}</label>
                            <label>{item.paymentAt}</label>
                            <label>{item.receiptNo}</label>
                        </div>
                    ))}
                    {error ? <div>Error: {error}</div> : null}
                </>
            )}
        </div>
    );
};

export default BillingHistorySearchDetail;
