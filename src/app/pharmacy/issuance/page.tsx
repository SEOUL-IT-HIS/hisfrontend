import IssuanceRegisterForm from "@/components/pharmacy/IssuanceRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <IssuanceRegisterForm />
    </PharmacyShell>
  );
}
