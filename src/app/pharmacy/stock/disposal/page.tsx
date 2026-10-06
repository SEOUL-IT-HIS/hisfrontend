import DisposalRegisterForm from "@/components/pharmacy/DisposalRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <DisposalRegisterForm />
    </PharmacyShell>
  );
}
