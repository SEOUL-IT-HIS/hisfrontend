"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
    Alert,
    Button,
    FormField,
    Input,
} from "@/components/common";
import type { PatientContact } from "@/features/patient/type/patientContactType";
import PostcodeSearchButton from "./PostcodeSearchButton";

export type PatientContactFormValues = {
    zipCode: string;
    address: string;
    addressDetail: string;
    phoneNo: string;
};

type Props = {
    patientName: string;
    patientId: string;
    mode: "create" | "update";
    item?: PatientContact;
    submitting: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (values: PatientContactFormValues) => void;
};

export default function PatientContactFormModal({
    patientName,
    patientId,
    mode,
    item,
    submitting,
    error,
    onClose,
    onSubmit,
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const zipCodeId = useId();
    const addressId = useId();
    const addressDetailId = useId();
    const phoneNoId = useId();

    const [zipCode, setZipCode] = useState(item?.zipCode ?? "");
    const [address, setAddress] = useState(item?.address ?? "");
    const [addressDetail, setAddressDetail] = useState(
        item?.addressDetail ?? "",
    );
    const [phoneNo, setPhoneNo] = useState(item?.phoneNo ?? "");
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const opener = document.activeElement;

        dialog?.showModal();

        return () => {
            dialog?.close();

            if (opener instanceof HTMLElement && opener.isConnected) {
                opener.focus();
            }
        };
    }, []);

    const normalizedPhoneNo = phoneNo.replace(/[^0-9]/g, "");
    const hasContactValue =
        zipCode.trim().length > 0 ||
        address.trim().length > 0 ||
        addressDetail.trim().length > 0 ||
        normalizedPhoneNo.length > 0;

    const zipCodeValid =
        zipCode.trim().length === 0 || /^\d{5}$/.test(zipCode.trim());

    const phoneNoValid =
        normalizedPhoneNo.length === 0 ||
        /^\d{9,11}$/.test(normalizedPhoneNo);

    const valid =
        hasContactValue &&
        zipCodeValid &&
        phoneNoValid &&
        address.trim().length <= 300 &&
        addressDetail.trim().length <= 300;

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasContactValue) {
            setValidationError("Enter at least one address or phone number field.");
            return;
        }

        if (!zipCodeValid) {
            setValidationError("Postal code must contain exactly 5 digits.");
            return;
        }

        if (!phoneNoValid) {
            setValidationError("Phone number must contain 9 to 11 digits.");
            return;
        }

        if (address.trim().length > 300 || addressDetail.trim().length > 300) {
            setValidationError("Address and address details must each be 300 characters or fewer.");
            return;
        }

        setValidationError(null);

        onSubmit({
            zipCode: zipCode.trim(),
            address: address.trim(),
            addressDetail: addressDetail.trim(),
            phoneNo: normalizedPhoneNo,
        });
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();

                if (!submitting) {
                    onClose();
                }
            }}
            className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/45"
        >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 id={titleId} className="text-base font-semibold">
                    {mode === "create"
                        ? "Add Address and Contact Information"
                        : "Edit Address and Contact Information"}
                </h2>

                <Button
                    variant="ghost"
                    aria-label="Close address and contact information dialog"
                    disabled={submitting}
                    onClick={onClose}
                >
                    ✕
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4">
                <div className="mb-5 rounded-xl bg-slate-50 px-3 py-2">
                    <p className="font-semibold">{patientName}</p>
                    <p className="break-all text-xs text-slate-500">
                        Patient ID: {patientId}
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        label="Postal Code"
                        htmlFor={zipCodeId}
                        hint="Filled automatically when you use address search."
                    >
                        <div className="flex gap-2">
                            <Input
                                id={zipCodeId}
                                value={zipCode}
                                onChange={(event) =>
                                    setZipCode(event.target.value.replace(/[^0-9]/g, ""))
                                }
                                disabled={submitting}
                                maxLength={5}
                                inputMode="numeric"
                                placeholder="12345"
                            />

                            <PostcodeSearchButton
                                disabled={submitting}
                                onSelect={(result) => {
                                    setZipCode(result.zipCode);
                                    setAddress(result.address);
                                    setValidationError(null);
                                }}
                            />
                        </div>
                    </FormField>

                    <FormField label="Address" htmlFor={addressId}>
                        <Input
                            id={addressId}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            disabled={submitting}
                            maxLength={300}
                            placeholder="Filled automatically after address search."
                        />
                    </FormField>

                    <FormField label="Address Details" htmlFor={addressDetailId}>
                        <Input
                            id={addressDetailId}
                            value={addressDetail}
                            onChange={(event) => setAddressDetail(event.target.value)}
                            disabled={submitting}
                            maxLength={300}
                            placeholder="Enter address details (e.g., building or unit number)"
                        />
                    </FormField>

                    <FormField
                        label="Phone Number"
                        htmlFor={phoneNoId}
                        hint="Saved as 9 to 11 digits without hyphens."
                    >
                        <Input
                            id={phoneNoId}
                            value={phoneNo}
                            onChange={(event) =>
                                setPhoneNo(event.target.value.replace(/[^0-9]/g, ""))
                            }
                            disabled={submitting}
                            maxLength={11}
                            inputMode="numeric"
                            placeholder="01012345678"
                        />
                    </FormField>
                </div>

                {validationError ? (
                    <Alert className="mt-4">{validationError}</Alert>
                ) : null}

                {error ? <Alert className="mt-4">{error}</Alert> : null}

                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={submitting}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting || !valid}
                    >
                        {submitting
                            ? "Saving..."
                            : mode === "create"
                                ? "Add"
                                : "Save"}
                    </Button>
                </div>
            </form>
        </dialog>
    );
}