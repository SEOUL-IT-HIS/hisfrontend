import Link from "next/link";
import type { ReactNode } from "react";

type BillingMenuItem = {
    href: string;
    title: string;
    description: string;
    chip: string;
    ring: string;
    icon: ReactNode;
};

const MENU_ITEMS: BillingMenuItem[] = [
    {
        href: "/billing/statistics",
        title: "Fee Reference Info",
        description: "수납정보 · Manage the fee schedule used to calculate charges",
        chip: "bg-sky-50 text-sky-600 group-hover:bg-sky-100",
        ring: "hover:border-sky-300",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l1 3H8l1-3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Z" />
                <path strokeLinecap="round" d="M9 11h6M9 15h6" />
            </svg>
        ),
    },
    {
        href: "/billing/payment",
        title: "Billing Detail & Payment",
        description: "진료비 상세 · Look up a patient's charges and process payment",
        chip: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
        ring: "hover:border-emerald-300",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="12" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.6c0 2.1-5 1-5 3.1 0 1 1 1.6 2.5 1.6s2.5-.5 2.5-1.5" />
            </svg>
        ),
    },
    {
        href: "/billing/history",
        title: "Billing History",
        description: "수납내역 · Review a patient's past billing and payment records",
        chip: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
        ring: "hover:border-violet-300",
        icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="12" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2" />
            </svg>
        ),
    },
];

const BillingManagementPage = () => {
    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <header>
                <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Billing Management</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Choose an area below to manage fee reference info, process payments, or review billing history.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {MENU_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <div
                            className={`group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${item.ring}`}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${item.chip}`}
                                >
                                    {item.icon}
                                </div>
                                <svg
                                    viewBox="0 0 20 20"
                                    className="h-4 w-4 -translate-x-1 text-slate-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-slate-400 group-hover:opacity-100"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden
                                >
                                    <path d="M7.5 5 12.5 10 7.5 15" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">{item.title}</h2>
                                <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BillingManagementPage;
//카드메뉴 정리 