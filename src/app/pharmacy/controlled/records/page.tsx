import ControlledDrugRecordList from "@/components/pharmacy/ControlledDrugRecordList";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

export default function Page() {
  return (
    <PharmacyShell group="controlled">
      <ControlledDrugRecordList />
    </PharmacyShell>
  );
}
