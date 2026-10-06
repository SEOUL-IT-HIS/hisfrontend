import SupplierRegisterForm from "@/components/pharmacy/SupplierRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="masterData">
      <SupplierRegisterForm />
    </PharmacyShell>
  );
}
