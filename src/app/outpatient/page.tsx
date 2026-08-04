import Link from "next/link";

export default function Page() {
    return (
        <div>
            <h2>외래 (Outpatient)</h2>
            <ul>
                <li><Link href="/outpatient/encounter">당일 진료 목록</Link></li>
                <li><Link href="/outpatient/medicalrecord">진료기록 조회</Link></li>
            </ul>
        </div>
    );
}