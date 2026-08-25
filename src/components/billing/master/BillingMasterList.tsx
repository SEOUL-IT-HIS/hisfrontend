"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import BillingMasterRow from "@/components/billing/master/BillingMasterRow";

export default function BillingMasterList() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { list, listStatus } = useSelector((state: RootState) => state.billingMaster);

    useEffect(() => {
        dispatch(fetchBillingMasterRequest());
    }, [dispatch]);

    return (
        <div>
            <h2>수납 기준정보</h2>
            <button onClick={() => router.push('/billing/master/register')}>수납 기준등록</button>

            {listStatus.loading && <p>로딩중...</p>}
            {listStatus.error && <p>{listStatus.error}</p>}
            {!listStatus.loading &&
                <div>
                    {list.map(e => (<BillingMasterRow key={e.billingMasterId} billingMaster={e} />))}
                </div>
            }
        </div>
    );
}
