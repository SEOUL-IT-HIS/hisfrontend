import LowStockList from "@/components/pharmacy/LowStockList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <LowStockList />
    </PharmacyShell>
  );
}
