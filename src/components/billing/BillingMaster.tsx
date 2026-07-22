"use client"

import { AppDispatch, RootState } from '@/store/store';
import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

const BillingMaster = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, list } = useSelector((state: RootState) => ({
        loading: state.billingMaster.listStatus.loading,
        error: state.billingMaster.listStatus.error,
        list: state.billingMaster.list
    }), shallowEqual);

    useEffect(() => {
        dispatch(fetchEmpRequest())
    }, [dispatch]);

    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && 
                <div>
                    {list?.map(e => (<key={e.billingMasterId} billingMaster={e} />))}
                </div>
            }
        </div>
    );
};

export default BillingMaster;