"use client"

import type { AppDispatch, RootState } from '@/store/store';
import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchBillingMasterRequest } from '@/features/billing/billingMaster/slice';
import { useRouter } from 'next/navigation';
import BillingMasterRow from '@/components/billing/billingMasterRow';

const billingMaster = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.billingMaster.listStatus.loading,
        error: state.billingMaster.listStatus.error,
        list: state.billingMaster.list
    }), shallowEqual);

    useEffect(() => {
        dispatch(fetchBillingMasterRequest())
    }, [dispatch]);

    return (
        <div>

                <h2>수납 기준정보</h2>
                <button onClick={() => router.push('/billing/master/register')}>수납 기준등록</button>
            
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && 
                <div>
                    {list?.map(e => (<BillingMasterRow key={e.billingMasterId} billingMaster={e} />))}
                </div>
            }
        </div>
    );
};

export default billingMaster;