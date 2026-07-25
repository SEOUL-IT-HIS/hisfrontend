export interface BillingDetailSearchCondition {
    patientName?: string;
    patientId?: string;
    billingStatus?: string;
}

export interface BillingDetail {
    billingDetailId: string;
    patientName: string;
    tel: string;
    addr: string;
    itemName: string;
    price: string;
}