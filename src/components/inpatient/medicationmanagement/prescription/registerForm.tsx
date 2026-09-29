"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  createPrescriptionRequest,
  selectPrescriptionCreateStatus,
} from "@/features/inpatient/medicationmanagement/prescription/slice";
import type { PrescriptionItemDTO } from "@/features/inpatient/medicationmanagement/types";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

type ItemFormRow = {
  prescriptionType: string;
  itemCode: string;
  itemName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  detailInfo: string;
  dosageFormCd: string;
};

const EMPTY_ITEM: ItemFormRow = {
  prescriptionType: "",
  itemCode: "",
  itemName: "",
  dosage: "",
  frequency: "",
  durationDays: "",
  detailInfo: "",
  dosageFormCd: "",
};

type PrescriptionRegisterFormProps = {
  admissionId: string;
  onSuccess?: () => void;
};

const PrescriptionRegisterForm = ({ admissionId, onSuccess }: PrescriptionRegisterFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector(selectPrescriptionCreateStatus);

  const [form, setForm] = useState({
    serviceType: "",
    orderMethod: "",
    priorityCode: "",
    timingCode: "",
  });
  const [items, setItems] = useState<ItemFormRow[]>([{ ...EMPTY_ITEM }]);

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [name]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requestItems: PrescriptionItemDTO[] = items.map((item) => ({
      itemId: "",
      prescriptionId: "",
      prescriptionType: item.prescriptionType,
      itemCode: item.itemCode,
      itemName: item.itemName,
      dosage: Number(item.dosage) || 0,
      frequency: item.frequency,
      durationDays: item.durationDays,
      detailInfo: item.detailInfo,
      sendStatus: "",
      sentAt: new Date(),
      labOrderId: "",
      rejectReason: "",
      dosageFormCd: item.dosageFormCd,
    }));

    dispatch(
      createPrescriptionRequest({
        admissionId,
        request: {
          patientId: "",
          serviceType: form.serviceType,
          orderMethod: form.orderMethod,
          priorityCode: form.priorityCode,
          timingCode: form.timingCode,
          items: requestItems,
        },
      })
    );
  };

  useEffect(() => {
    if (!success) return;
    setForm({ serviceType: "", orderMethod: "", priorityCode: "", timingCode: "" });
    setItems([{ ...EMPTY_ITEM }]);
    onSuccess?.();
  }, [success]);

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-800">Register Prescription</h1>
        <p className="mt-1 text-sm text-slate-500">Send a prescription request to the outpatient prescription core.</p>
      </div>

      {loading && <p className="mb-3 text-sm text-slate-500">Submitting...</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceType" className={LABEL}>Service Type</label>
            <input type="text" id="serviceType" name="serviceType" value={form.serviceType} onChange={onFormChange} required className={FIELD} />
          </div>
          <div>
            <label htmlFor="orderMethod" className={LABEL}>Order Method</label>
            <input type="text" id="orderMethod" name="orderMethod" value={form.orderMethod} onChange={onFormChange} required className={FIELD} />
          </div>
          <div>
            <label htmlFor="priorityCode" className={LABEL}>Priority Code</label>
            <input type="text" id="priorityCode" name="priorityCode" value={form.priorityCode} onChange={onFormChange} required className={FIELD} />
          </div>
          <div>
            <label htmlFor="timingCode" className={LABEL}>Timing Code</label>
            <input type="text" id="timingCode" name="timingCode" value={form.timingCode} onChange={onFormChange} required className={FIELD} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">Items</p>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center rounded-lg border border-sky-300 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              + Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Item {index + 1}</p>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Prescription Type</label>
                  <input type="text" name="prescriptionType" value={item.prescriptionType} onChange={(e) => onItemChange(index, e)} required className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Item Code</label>
                  <input type="text" name="itemCode" value={item.itemCode} onChange={(e) => onItemChange(index, e)} required className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Item Name</label>
                  <input type="text" name="itemName" value={item.itemName} onChange={(e) => onItemChange(index, e)} required className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Dosage</label>
                  <input type="number" step="0.1" name="dosage" value={item.dosage} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Frequency</label>
                  <input type="text" name="frequency" value={item.frequency} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Duration Days</label>
                  <input type="text" name="durationDays" value={item.durationDays} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                </div>
                <div>
                  <label className={LABEL}>Dosage Form Code</label>
                  <input type="text" name="dosageFormCd" value={item.dosageFormCd} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL}>Detail Info</label>
                  <input type="text" name="detailInfo" value={item.detailInfo} onChange={(e) => onItemChange(index, e)} className={FIELD} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default PrescriptionRegisterForm;
