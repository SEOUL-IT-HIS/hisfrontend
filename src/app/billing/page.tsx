import Link from "next/link";

const billingpage = () => {
    return (
        <div>
            <Link href="/billing/master">수납정보</Link><br/>
            <Link href="/billing/payment-detail">진료비 상세</Link>
        </div>
    );
};
export default billingpage;