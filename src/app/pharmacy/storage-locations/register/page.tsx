import StorageLocationRegisterForm from "@/components/pharmacy/StorageLocationRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="masterData">
      <StorageLocationRegisterForm />
    </PharmacyShell>
  );
}
