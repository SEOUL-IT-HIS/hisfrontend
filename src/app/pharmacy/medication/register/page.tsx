import MedicationRegisterForm from "@/components/pharmacy/MedicationRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="masterData">
      <MedicationRegisterForm />
    </PharmacyShell>
  );
}
