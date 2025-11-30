export interface PayrollPeriod {
    id: number;
    tenant_id: number;
    shop_id: number | null;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: PayrollStatus;
    processed_by_user_id: number | null;
    processed_at: string | null;
    approved_by_user_id: number | null;
    approved_at: string | null;
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    employee_count: number;
    includes_general_manager: boolean;
    requires_owner_approval: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    shop?: Shop;
    processedBy?: User;
    approvedBy?: User;
    payslips?: Payslip[];
}

export interface Payslip {
    id: number;
    payroll_period_id: number;
    user_id: number;
    tenant_id: number;
    shop_id: number;
    base_salary: number;
    regular_hours: number;
    regular_pay: number;
    overtime_hours: number;
    overtime_pay: number;
    bonus: number;
    commission: number;
    gross_pay: number;
    income_tax: number;
    pension_employee: number;
    pension_employer: number;
    nhf: number;
    nhis: number;
    wage_advance_deduction: number;
    other_deductions: number;
    total_deductions: number;
    net_pay: number;
    earnings_breakdown: EarningsBreakdown;
    deductions_breakdown: DeductionsBreakdown;
    tax_breakdown: TaxBreakdown | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: User;
    shop?: Shop;
    payrollPeriod?: PayrollPeriod;
}

export interface EmployeePayrollDetail {
    id: number;
    user_id: number;
    tenant_id: number;
    employment_type: EmploymentType;
    pay_type: PayType;
    pay_amount: number;
    pay_frequency: PayFrequency;
    tax_handling: TaxHandling;
    enable_tax_calculations: boolean;
    tax_id_number: string | null;
    pension_enabled: boolean;
    pension_employee_rate: number;
    pension_employer_rate: number;
    nhf_enabled: boolean;
    nhf_rate: number;
    nhis_enabled: boolean;
    nhis_amount: number | null;
    other_deductions_enabled: boolean;
    bank_account_number: string | null;
    bank_name: string | null;
    routing_number: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    position_title: string | null;
    department: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface WageAdvance {
    id: number;
    user_id: number;
    shop_id: number;
    tenant_id: number;
    amount_requested: number;
    amount_approved: number | null;
    status: WageAdvanceStatus;
    reason: string | null;
    requested_at: string;
    approved_by_user_id: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    disbursed_by_user_id: number | null;
    disbursed_at: string | null;
    repayment_start_date: string | null;
    repayment_installments: number;
    amount_repaid: number;
    fully_repaid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: User;
    shop?: Shop;
    approvedBy?: User;
    disbursedBy?: User;
}

export interface EmployeeCustomDeduction {
    id: number;
    user_id: number;
    tenant_id: number;
    deduction_name: string;
    deduction_type: DeductionType;
    amount: number;
    percentage: number | null;
    is_active: boolean;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface EarningsBreakdown {
    base_salary: number;
    regular_hours: number;
    regular_pay: number;
    overtime_hours: number;
    overtime_pay: number;
    bonus: number;
    commission: number;
    gross_pay: number;
}

export interface DeductionsBreakdown {
    income_tax: number;
    pension_employee: number;
    pension_employer: number;
    nhf: number;
    nhis: number;
    wage_advance_deduction: number;
    other_deductions: number;
    total_deductions: number;
    tax_details?: TaxBreakdown;
}

export interface TaxBreakdown {
    total_tax: number;
    tax_bands: TaxBand[];
    consolidated_relief: number;
    gross_income: number;
}

export interface TaxBand {
    rate: number;
    amount: number;
    band_min: number;
    band_max: number | null;
}

export type PayrollStatus = 'draft' | 'processing' | 'processed' | 'approved' | 'paid' | 'cancelled';

export type WageAdvanceStatus = 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaying' | 'repaid' | 'cancelled';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'freelance';

export type PayType = 'salary' | 'hourly' | 'daily' | 'commission_based';

export type PayFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'annually';

export type TaxHandling = 'employee_calculates' | 'shop_calculates';

export type DeductionType =
    | 'fixed_amount'
    | 'percentage'
    | 'loan_repayment'
    | 'advance_repayment'
    | 'insurance'
    | 'union_dues'
    | 'savings'
    | 'other';

export interface User {
    id: number;
    name: string;
    email: string;
    tenant_id: number;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Shop {
    id: number;
    tenant_id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}
