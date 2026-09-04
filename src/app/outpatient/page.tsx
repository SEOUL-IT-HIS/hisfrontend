import Link from "next/link";

export default function Page() {
    return (
        <div>
            {/* 외래 (Outpatient) */}
            <h2>Outpatient</h2>
            <ul>
                {/* 당일 진료 목록 */}
                <li><Link href="/outpatient/encounter">Today&apos;s Patient List</Link></li>
                {/* 진료기록 조회 */}
                <li><Link href="/outpatient/medicalrecord">Medical Records</Link></li>
            </ul>
        </div>
    );
}