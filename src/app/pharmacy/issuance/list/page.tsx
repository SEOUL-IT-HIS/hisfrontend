import IssuanceList from "@/components/pharmacy/IssuanceList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="inventory">
      <IssuanceList />
    </PharmacyShell>
  );
}
