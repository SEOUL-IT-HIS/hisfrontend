"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, FormField, Input, Panel, Select } from "@/components/common";
import {
  createSurgeryPlannedItem,
  deleteSurgeryPlannedItem,
  getSurgeryPlannedItems,
} from "@/features/surgery/planneditem/api";
import type { SurgeryPlannedItem } from "@/features/surgery/planneditem/types";

const ITEM_TYPE_OPTIONS = [
  { value: "01", label: "Equipment" },
  { value: "02", label: "Medicine" },
  { value: "03", label: "Material" },
];

type PlannedItemsPanelProps = {
  surgeryId: string;
};

export default function PlannedItemsPanel({
  surgeryId,
}: PlannedItemsPanelProps) {
  const [items, setItems] = useState<SurgeryPlannedItem[]>([]);
  const [itemType, setItemType] = useState("01");
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getSurgeryPlannedItems(surgeryId)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load planned items.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [surgeryId]);

  async function submitPlannedItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createSurgeryPlannedItem(surgeryId, {
        itemTypeCd: itemType,
        itemCode: itemCode.trim(),
        quantity: Number(quantity),
      });
      setItems(await getSurgeryPlannedItems(surgeryId));
      setItemCode("");
      setQuantity("1");
      setNotice("Planned item saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to save the planned item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removePlannedItem(item: SurgeryPlannedItem) {
    if (!window.confirm(`Remove planned item ${item.itemCode}?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await deleteSurgeryPlannedItem(item.plannedItemId);
      setItems(await getSurgeryPlannedItems(surgeryId));
      setNotice("Planned item removed.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to remove the planned item.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{error}</Alert> : null}
      {notice ? <Alert variant="info">{notice}</Alert> : null}

      <Panel className="p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Add planned item
        </h2>
        <form
          onSubmit={submitPlannedItem}
          className="grid gap-3 sm:grid-cols-4"
        >
          <FormField label="Type" htmlFor="planned-item-type">
            <Select
              id="planned-item-type"
              options={ITEM_TYPE_OPTIONS}
              value={itemType}
              onChange={(event) => setItemType(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label="Item code" htmlFor="planned-item-code">
            <Input
              id="planned-item-code"
              required
              maxLength={36}
              value={itemCode}
              onChange={(event) => setItemCode(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label="Quantity" htmlFor="planned-item-quantity">
            <Input
              id="planned-item-quantity"
              required
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={saving}
            />
          </FormField>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={
                saving ||
                !itemCode.trim() ||
                !Number.isInteger(Number(quantity)) ||
                Number(quantity) < 1
              }
            >
              {saving ? "Saving…" : "Add planned item"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="overflow-x-auto p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Planned items
        </h2>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-500">No planned items.</p>
        ) : null}
        {!loading && items.length > 0 ? (
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Item code</th>
                <th className="py-2 pr-3">Quantity</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.plannedItemId} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    {ITEM_TYPE_OPTIONS.find(
                      (option) => option.value === item.itemTypeCd,
                    )?.label ?? item.itemTypeCd}
                  </td>
                  <td className="py-2 pr-3">{item.itemCode}</td>
                  <td className="py-2 pr-3">{item.quantity}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="text-rose-700 underline disabled:opacity-50"
                      disabled={saving}
                      onClick={() => void removePlannedItem(item)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Panel>
    </div>
  );
}
