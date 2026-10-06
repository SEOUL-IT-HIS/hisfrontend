import ControlledDrugDisposalForm from "@/components/pharmacy/ControlledDrugDisposalForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="controlled">
      <ControlledDrugDisposalForm />
    </PharmacyShell>
  );
}
