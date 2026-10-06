import ControlledDrugReceiptForm from "@/components/pharmacy/ControlledDrugReceiptForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="controlled">
      <ControlledDrugReceiptForm />
    </PharmacyShell>
  );
}
