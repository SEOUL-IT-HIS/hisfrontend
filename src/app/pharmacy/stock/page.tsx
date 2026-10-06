import InventoryList from "@/components/pharmacy/InventoryList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <InventoryList />
    </PharmacyShell>
  );
}
