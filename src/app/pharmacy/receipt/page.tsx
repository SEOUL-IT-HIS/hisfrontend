import ReceiptRegisterForm from "@/components/pharmacy/ReceiptRegisterForm";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <ReceiptRegisterForm />
    </PharmacyShell>
  );
}
