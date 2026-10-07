import MedicationList from "@/components/pharmacy/MedicationList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <MedicationList />
    </PharmacyShell>
  );
}
