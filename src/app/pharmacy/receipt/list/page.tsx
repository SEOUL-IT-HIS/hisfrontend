import ReceiptList from "@/components/pharmacy/ReceiptList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <ReceiptList />
    </PharmacyShell>
  );
}
