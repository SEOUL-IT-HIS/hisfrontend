"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchMedicationListRequest,
  fetchMedicationMovementsRequest,
  fetchMedicationStockRequest,
  registerDisposalRequest,
  registerIssuanceRequest,
  registerReceiptRequest,
} from "@/features/pharmacy/slice";
import {
  DataTable,
  FormActions,
  FormField,
  Input,
  PageHeader,
  Panel,
  Select,
} from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import SupplierSelect from "@/components/pharmacy/SupplierSelect";
import StorageLocationSelect from "@/components/pharmacy/StorageLocationSelect";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";
import type { RootState } from "@/store/store";
import type { InventoryDto, InventoryMovementDto, ReceiptRegisterRequest } from "@/features/pharmacy/types";

/** admin 공통코드 PHM_STOCK_TX_TYPE 라벨 — 코드값만 보여주면 알아보기 어려워 표시용으로만 둔다 */
const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  "01": "Receipt",
  "02": "Issuance",
  "03": "Disposal",
  "04": "Dispensing",
  "05": "Dispensing Cancel",
  "06": "Return",
};

const stockColumns: DataTableColumn<InventoryDto>[] = [
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "expirationDt", header: "Expiration", render: (row) => row.expirationDt ?? "-" },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
  { key: "currentQty", header: "Current Qty", render: (row) => row.currentQty },
];

const movementColumns: DataTableColumn<InventoryMovementDto>[] = [
  { key: "movementAt", header: "When", render: (row) => row.movementAt.replace("T", " ").slice(0, 19) },
  {
    key: "stockTxTypeCd",
    header: "Type",
    render: (row) => MOVEMENT_TYPE_LABELS[row.stockTxTypeCd] ?? row.stockTxTypeCd,
  },
  { key: "movementQty", header: "Qty", render: (row) => row.movementQty },
  {
    key: "beforeQty",
    header: "Before -> After",
    render: (row) => `${row.beforeQty} -> ${row.afterQty}`,
  },
  { key: "lotNo", header: "Lot No.", render: (row) => row.lotNo },
  { key: "storageLocationId", header: "Storage Location", render: (row) => row.storageLocationId },
];

/**
 * 품목 중심 워크스페이스 — 입고/재고/출고/폐기가 각자 다른 화면(PharmacyHome의 링크 모음)으로
 * 흩어져 있어 한 품목을 다루려면 화면을 계속 옮겨다녀야 했다. 이 화면은 품목 하나를 고정해두고
 * 현재 재고·최근 입출고 내역을 보면서 그 자리에서 바로 입고/출고/폐기까지 처리하게 묶었다
 * (billing의 BillingDetailWorkspace — 좌측에서 고른 대상을 우측에서 바로 처리하는 것과 같은 패턴).
 */
export default function MedicationWorkspace() {
  const dispatch = useDispatch();
  const params = useParams<{ id: string }>();
  const medicationId = params.id;

  const medications = useSelector((state: RootState) => state.pharmacy.medicationList);
  const medication = medications.find((m) => String(m.medicationId) === medicationId);

  const stockList = useSelector((state: RootState) => state.pharmacy.medicationStockList);
  const stockLoading = useSelector((state: RootState) => state.pharmacy.medicationStockLoading);
  const stockError = useSelector((state: RootState) => state.pharmacy.medicationStockError);

  const movementList = useSelector((state: RootState) => state.pharmacy.medicationMovementList);
  const movementLoading = useSelector((state: RootState) => state.pharmacy.medicationMovementLoading);
  const movementError = useSelector((state: RootState) => state.pharmacy.medicationMovementError);

  const refresh = () => {
    dispatch(fetchMedicationStockRequest(medicationId));
    dispatch(fetchMedicationMovementsRequest(medicationId));
  };

  useEffect(() => {
    if (medications.length === 0) {
      dispatch(fetchMedicationListRequest());
    }
    refresh();
    // medicationId가 바뀌면(다른 품목으로 이동) 다시 불러온다. refresh 자체는 의존성에 넣지 않는다
    // (매 렌더마다 새로 만들어지는 함수라 넣으면 무한 반복됨).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, medicationId]);

  // 입고 처리자(Handler)는 자유 텍스트로 받지 않고 admin에 실제 등록된 직원만 고를 수 있게 한다
  // (ReceiptRegisterForm과 같은 패턴).
  const [employees, setEmployees] = useState<Emp[]>([]);
  useEffect(() => {
    let ignore = false;
    fetchEmpApi().then((list) => {
      if (!ignore) setEmployees(list);
    });
    return () => {
      ignore = true;
    };
  }, []);
  const employeeOptions = employees.map((employee) => ({
    value: employee.empId,
    label: `${employee.empName} (${employee.empNo})`,
  }));

  // ----- 입고 -----
  const [supplierId, setSupplierId] = useState("");
  const [storageLocationId, setStorageLocationId] = useState("");
  const [receivedById, setReceivedById] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [expirationDt, setExpirationDt] = useState("");
  const [unitCd, setUnitCd] = useState("");
  const [receiptQty, setReceiptQty] = useState("");
  const receiptLoading = useSelector((state: RootState) => state.pharmacy.receiptRegisterLoading);
  const receiptError = useSelector((state: RootState) => state.pharmacy.receiptRegisterError);
  const wasReceiptLoading = useRef(false);

  useEffect(() => {
    if (wasReceiptLoading.current && !receiptLoading && !receiptError) {
      refresh();
      setLotNo("");
      setExpirationDt("");
      setUnitCd("");
      setReceiptQty("");
    }
    wasReceiptLoading.current = receiptLoading;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptLoading, receiptError]);

  const handleReceiptSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supplierId || !storageLocationId || !receivedById || !lotNo || !expirationDt || !unitCd || !receiptQty) {
      return;
    }
    const request: ReceiptRegisterRequest = {
      supplierId,
      storageLocationId,
      receiptDt: new Date().toISOString().slice(0, 10),
      receivedById,
      items: [{ medicationId, lotNo, expirationDt, unitCd, receiptQty: Number(receiptQty) }],
    };
    dispatch(registerReceiptRequest(request));
  };

  // ----- 출고 -----
  const [issuanceQty, setIssuanceQty] = useState("");
  const issuanceLoading = useSelector((state: RootState) => state.pharmacy.issuanceLoading);
  const issuanceError = useSelector((state: RootState) => state.pharmacy.issuanceError);
  const wasIssuanceLoading = useRef(false);

  useEffect(() => {
    if (wasIssuanceLoading.current && !issuanceLoading && !issuanceError) {
      refresh();
      setIssuanceQty("");
    }
    wasIssuanceLoading.current = issuanceLoading;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuanceLoading, issuanceError]);

  const handleIssuanceSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!issuanceQty) return;
    dispatch(registerIssuanceRequest({ medicationId, quantity: Number(issuanceQty) }));
  };

  // ----- 폐기 -----
  const [disposalQty, setDisposalQty] = useState("");
  const [disposalReason, setDisposalReason] = useState("");
  const disposalLoading = useSelector((state: RootState) => state.pharmacy.disposalLoading);
  const disposalError = useSelector((state: RootState) => state.pharmacy.disposalError);
  const wasDisposalLoading = useRef(false);

  useEffect(() => {
    if (wasDisposalLoading.current && !disposalLoading && !disposalError) {
      refresh();
      setDisposalQty("");
      setDisposalReason("");
    }
    wasDisposalLoading.current = disposalLoading;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disposalLoading, disposalError]);

  const handleDisposalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!disposalQty || !disposalReason) return;
    dispatch(registerDisposalRequest({ medicationId, quantity: Number(disposalQty), reason: disposalReason }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title={medication ? medication.medicationName : `Medication #${medicationId}`}
        description={
          medication
            ? `Medication ID ${medicationId} · EDI ${medication.ediCode ?? "-"}`
            : "Loading medication info..."
        }
      />
      <Link href="/pharmacy/list" className="text-sm text-sky-700 underline">
        Back to Medication List
      </Link>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          <Panel className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Current Stock</h3>
            <DataTable
              columns={stockColumns}
              rows={stockList}
              rowKey={(row) => row.medicationStockId}
              loading={stockLoading}
              loadingMessage="Loading..."
              emptyMessage={stockError ?? "No stock for this medication."}
            />
          </Panel>
          <Panel className="min-h-0 flex-1 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Recent Activity</h3>
            <DataTable
              columns={movementColumns}
              rows={movementList}
              rowKey={(row) => row.inventoryMovementId}
              loading={movementLoading}
              loadingMessage="Loading..."
              emptyMessage={movementError ?? "No activity yet."}
            />
          </Panel>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <Panel className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Register Receipt</h3>
            {receiptError && <p className="mb-2 text-sm text-rose-500">{receiptError}</p>}
            <form onSubmit={handleReceiptSubmit} className="flex flex-col gap-3">
              <FormField label="Supplier" required>
                <SupplierSelect value={supplierId} onChange={(e) => setSupplierId(e.target.value)} />
              </FormField>
              <FormField label="Storage Location" required>
                <StorageLocationSelect
                  value={storageLocationId}
                  onChange={(e) => setStorageLocationId(e.target.value)}
                />
              </FormField>
              <FormField label="Handler" required>
                <Select
                  placeholder="Select handler"
                  options={employeeOptions}
                  value={receivedById}
                  onChange={(e) => setReceivedById(e.target.value)}
                />
              </FormField>
              <FormField label="Lot No." required>
                <Input type="text" placeholder="Lot No." value={lotNo} onChange={(e) => setLotNo(e.target.value)} />
              </FormField>
              <FormField label="Expiration Date" required>
                <Input type="date" value={expirationDt} onChange={(e) => setExpirationDt(e.target.value)} />
              </FormField>
              <FormField label="Unit Code" required>
                <Input type="text" placeholder="e.g. EA" value={unitCd} onChange={(e) => setUnitCd(e.target.value)} />
              </FormField>
              <FormField label="Receipt Qty" required>
                <Input
                  type="number"
                  placeholder="Receipt Qty"
                  value={receiptQty}
                  onChange={(e) => setReceiptQty(e.target.value)}
                />
              </FormField>
              <FormActions
                submitLabel="Register Receipt"
                loading={receiptLoading}
                cancelLabel="Reset"
                onCancel={() => {
                  setLotNo("");
                  setExpirationDt("");
                  setUnitCd("");
                  setReceiptQty("");
                }}
              />
            </form>
          </Panel>

          <Panel className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Register Issuance</h3>
            {issuanceError && <p className="mb-2 text-sm text-rose-500">{issuanceError}</p>}
            <form onSubmit={handleIssuanceSubmit} className="flex flex-col gap-3">
              <FormField label="Issue Qty" required hint="Deducted from the earliest-expiring lot automatically (FEFO).">
                <Input
                  type="number"
                  placeholder="Issue Qty"
                  value={issuanceQty}
                  onChange={(e) => setIssuanceQty(e.target.value)}
                />
              </FormField>
              <FormActions
                submitLabel="Register Issuance"
                loading={issuanceLoading}
                cancelLabel="Reset"
                onCancel={() => setIssuanceQty("")}
              />
            </form>
          </Panel>

          <Panel className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Register Disposal</h3>
            {disposalError && <p className="mb-2 text-sm text-rose-500">{disposalError}</p>}
            <form onSubmit={handleDisposalSubmit} className="flex flex-col gap-3">
              <FormField label="Disposal Qty" required hint="Deducted from the earliest-expiring lot automatically (FEFO).">
                <Input
                  type="number"
                  placeholder="Disposal Qty"
                  value={disposalQty}
                  onChange={(e) => setDisposalQty(e.target.value)}
                />
              </FormField>
              <FormField label="Disposal Reason" required>
                <Input
                  type="text"
                  placeholder="Disposal Reason"
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                />
              </FormField>
              <FormActions
                submitLabel="Register Disposal"
                loading={disposalLoading}
                cancelLabel="Reset"
                onCancel={() => {
                  setDisposalQty("");
                  setDisposalReason("");
                }}
              />
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
