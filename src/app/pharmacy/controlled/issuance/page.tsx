import ControlledDrugIssuanceForm from "@/components/pharmacy/ControlledDrugIssuanceForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="controlled">
      <ControlledDrugIssuanceForm />
    </PharmacyShell>
  );
}
