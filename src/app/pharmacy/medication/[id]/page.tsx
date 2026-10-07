import MedicationWorkspace from "@/components/pharmacy/MedicationWorkspace";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <MedicationWorkspace />
    </PharmacyShell>
  );
}
