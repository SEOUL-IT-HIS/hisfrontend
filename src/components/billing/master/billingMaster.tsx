"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import BillingMasterRow from "@/components/billing/master/billingMasterRow";
import { Alert, Button, FormField, Input, Panel, SearchBar } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

const BillingMaster = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, list } = useSelector(
    (state: RootState) => ({
      loading: state.billing.billingMaster.listStatus.loading,
      error: state.billing.billingMaster.listStatus.error,
      list: state.billing.billingMaster.list,
    }),
    shallowEqual,
  );

  const [keyword, setKeyword] = useState(""); // text in the input box
  const [appliedKeyword, setAppliedKeyword] = useState(""); // keyword actually used for filtering (set on Search)

  useEffect(() => {
    dispatch(fetchBillingMasterRequest());
  }, [dispatch]);

  // The list API returns every active billing master, so filtering by fee name / fee code is done here.
  const filteredList = useMemo(() => {
    const query = appliedKeyword.trim().toLowerCase();
    if (!query) return list ?? [];
    return (list ?? []).filter(
      (item) =>
        item.feeName.toLowerCase().includes(query) || item.feeCode.toLowerCase().includes(query),
    );
  }, [list, appliedKeyword]);

  const onReset = () => {
    setKeyword("");
    setAppliedKeyword("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Billing Master</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage registered fee master information.</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/billing/statistics/register")}>
          Register Billing Master
        </Button>
      </header>

      <SearchBar
        onSearch={() => setAppliedKeyword(keyword)}
        onReset={onReset}
        searchLabel="Search"
        resetLabel="Reset"
      >
        <FormField label="Fee Name / Code" htmlFor="billingMasterKeyword" className="min-w-[240px] flex-1">
          <Input
            id="billingMasterKeyword"
            value={keyword}
            placeholder="Enter fee name or fee code"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </FormField>
      </SearchBar>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Panel>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Fee List</h2>
            <p className="mt-0.5 text-xs text-slate-400">Click a row to open its details</p>
          </div>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
            {filteredList.length} results
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="w-16 px-5 py-3 font-medium">No.</th>
                <th className="px-5 py-3 font-medium">Fee Name / Code</th>
                <th className="px-5 py-3 text-right font-medium">Default Price</th>
                <th className="px-5 py-3 font-medium">Effective Period</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center text-slate-400">
                    {appliedKeyword.trim()
                      ? "No billing masters match your search."
                      : "No billing masters registered."}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <BillingMasterRow key={item.billingMasterId} billingMaster={item} no={index + 1} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default BillingMaster;
