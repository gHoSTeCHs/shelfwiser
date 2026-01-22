import { User } from './index';
import { Shop } from './shop';

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
    pay_run_id: number | null;
    user_id: number;
    tenant_id: number;
    shop_id: number | null;
    basic_salary: number;
    regular_hours: number;
    regular_pay: number;
    overtime_hours: number;
    overtime_pay: number;
    bonus: number;
    commission: number;
    gross_pay: number;
    gross_earnings: number;
    income_tax: number;
    pension_employee: number;
    pension_employer: number;
    nhf: number;
    nhis: number;
    wage_advance_deduction: number;
    other_deductions: number;
    total_deductions: number;
    net_pay: number;
    earnings_breakdown: EarningsBreakdown | EarningBreakdownItem[];
    deductions_breakdown: DeductionsBreakdown | DeductionBreakdownItem[];
    tax_breakdown: TaxBreakdown | null;
    tax_calculation: TaxCalculation | null;
    employer_contributions: EmployerContributions | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: User;
    shop?: Shop;
    payrollPeriod?: PayrollPeriod;
    payRun?: PayRun;
    tax_law_version_label?: string;
}

export interface EmployerContributions {
    pension: number;
    nhf: number;
    total: number;
}

export interface EmployeePayrollDetail {
    id: number;
    user_id: number;
    tenant_id: number;
    employment_type: EmploymentType;
    pay_type: PayType;
    pay_amount: string;
    pay_frequency: PayFrequency;
    pay_calendar_id: number | null;
    standard_hours_per_week: string;
    commission_rate: string | null;
    commission_cap: string | null;
    tax_handling: TaxHandling;
    enable_tax_calculations: boolean;
    tax_id_number: string | null;
    pension_enabled: boolean;
    pension_employee_rate: string;
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
    repayments?: WageAdvanceRepayment[];
}

export interface WageAdvanceRepayment {
    id: number;
    wage_advance_id: number;
    tenant_id: number;
    payroll_period_id: number | null;
    amount: number;
    repayment_date: string;
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
    recorded_by: number;
    created_at: string;
    updated_at: string;
    wageAdvance?: WageAdvance;
    recordedBy?: User;
    payrollPeriod?: PayrollPeriod;
}

export interface RepaymentStatistics {
    approved_amount: number;
    amount_repaid: number;
    remaining_balance: number;
    percentage_repaid: number;
    total_repayments: number;
    last_repayment_date: string | null;
    last_repayment_amount: number | null;
    average_repayment_amount: number;
    expected_installments: number;
    installment_amount: number;
}

export interface RepaymentSchedule {
    installment_number: number;
    amount: number;
    due_date: string;
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
    basic_salary: number;
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

export type PayrollStatus =
    | 'draft'
    | 'processing'
    | 'processed'
    | 'approved'
    | 'paid'
    | 'cancelled';

export type WageAdvanceStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'disbursed'
    | 'repaying'
    | 'repaid'
    | 'cancelled';

export type EmploymentType =
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'seasonal'
    | 'intern';

export type PayType = 'salary' | 'hourly' | 'daily' | 'commission_based';

export type PayFrequency =
    | 'daily'
    | 'weekly'
    | 'bi_weekly'
    | 'semi_monthly'
    | 'monthly';

export type TaxHandling = 'shop_calculates' | 'employee_calculates' | 'exempt';

export type DeductionType =
    | 'fixed_amount'
    | 'percentage'
    | 'loan_repayment'
    | 'advance_repayment'
    | 'insurance'
    | 'union_dues'
    | 'savings'
    | 'other';

export interface PayRun {
    id: number;
    tenant_id: number;
    payroll_period_id: number;
    pay_calendar_id: number | null;
    reference: string;
    name: string;
    status: PayRunStatus;
    employee_count: number;
    total_gross: string;
    total_deductions: string;
    total_net: string;
    total_employer_costs: string;
    calculated_by: number | null;
    calculated_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    completed_by: number | null;
    completed_at: string | null;
    notes: string | null;
    metadata: Record<string, unknown> | null;
    tax_law_version?: TaxLawVersion | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    payroll_period?: PayrollPeriod;
    pay_calendar?: PayCalendar;
    items?: PayRunItem[];
    payslips?: Payslip[];
    calculated_by_user?: User;
    approved_by_user?: User;
    completed_by_user?: User;
    status_label?: string;
    status_color?: string;
    tax_law_version_label?: string;
}

export interface PayRunItem {
    id: number;
    tenant_id: number;
    pay_run_id: number;
    user_id: number;
    payslip_id: number | null;
    status: PayRunItemStatus;
    basic_salary: string;
    gross_earnings: string;
    taxable_earnings: string;
    total_deductions: string;
    net_pay: string;
    employer_pension: string;
    employer_nhf: string;
    total_employer_cost: string;
    earnings_breakdown: EarningBreakdownItem[] | null;
    deductions_breakdown: DeductionBreakdownItem[] | null;
    tax_calculation: TaxCalculation | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: User;
    pay_run?: PayRun;
    payslip?: Payslip;
    status_label?: string;
    status_color?: string;
    tax_law_version_label?: string;
}

export interface EarningBreakdownItem {
    type: string;
    code: string;
    category: string;
    amount: number;
    hours?: number;
    rate?: number;
    is_taxable?: boolean;
    is_pensionable?: boolean;
}

export interface DeductionBreakdownItem {
    type: string;
    code: string;
    category: string;
    amount: number;
    deduction_id?: number;
    is_pre_tax?: boolean;
}

export interface TaxCalculation {
    gross_income: number;
    taxable_income: number;
    annual_taxable_income?: number;
    consolidated_relief?: number;
    total_reliefs?: number;
    cra_amount?: number;
    rent_relief?: number;
    pension_relief?: number;
    reliefs_applied?: AppliedRelief[];
    annual_tax: number;
    monthly_tax?: number;
    tax: number;
    effective_rate?: number;
    bands?: TaxBandCalculation[];
    band_breakdown?: TaxBandBreakdown[];
    is_exempt?: boolean;
    is_low_income_exempt?: boolean;
    low_income_exempt?: boolean;
    exemption_reason?: string;
    tax_law_version?: TaxLawVersion | null;
    effective_date?: string;
}

export interface TaxBandCalculation {
    band_name: string;
    lower_limit: number;
    upper_limit: number | null;
    rate: number;
    taxable_in_band: number;
    tax_in_band: number;
}

export interface PayCalendar {
    id: number;
    tenant_id: number;
    name: string;
    description: string | null;
    frequency: PayFrequency;
    pay_day: number;
    cutoff_day: number | null;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    employees_count?: number;
}

export interface EarningTypeModel {
    id: number;
    tenant_id: number;
    code: string;
    name: string;
    description: string | null;
    category: EarningCategory;
    calculation_type: EarningCalculationType;
    default_amount: string;
    default_rate: string;
    is_taxable: boolean;
    is_pensionable: boolean;
    is_recurring: boolean;
    is_system: boolean;
    is_active: boolean;
    display_order: number;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface DeductionTypeModel {
    id: number;
    tenant_id: number;
    code: string;
    name: string;
    description: string | null;
    category: DeductionCategory;
    calculation_type: DeductionCalculationType;
    calculation_base: DeductionCalculationBase;
    default_amount: string;
    default_rate: string;
    max_amount: string | null;
    annual_cap: string | null;
    is_pre_tax: boolean;
    is_mandatory: boolean;
    is_system: boolean;
    is_active: boolean;
    priority: number;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface TaxTable {
    id: number;
    tenant_id: number | null;
    name: string;
    description: string | null;
    jurisdiction: string;
    effective_year: number;
    effective_from: string | null;
    effective_to: string | null;
    tax_law_reference: TaxLawVersion | null;
    has_low_income_exemption: boolean;
    low_income_threshold: number | null;
    cra_applicable: boolean;
    minimum_tax_rate: number | null;
    is_system: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    bands?: TaxTableBand[];
    reliefs?: TaxRelief[];
    tax_law_version_label?: string;
    is_current?: boolean;
}

export interface TaxTableBand {
    id: number;
    tax_table_id: number;
    band_name: string;
    lower_limit: number;
    upper_limit: number | null;
    rate: number;
    cumulative_tax: number;
}

export interface TaxRelief {
    id: number;
    tax_table_id: number;
    code: string;
    name: string;
    description: string | null;
    relief_type: TaxReliefType;
    amount: number | null;
    rate: number | null;
    cap: number | null;
    is_automatic: boolean;
    is_active: boolean;
    requires_proof: boolean;
    proof_type: string | null;
    eligibility_criteria: Record<string, unknown> | null;
    calculation_formula: string | null;
    created_at: string;
    updated_at: string;
    relief_description?: string;
}

export interface PayRunSummary {
    total_employees: number;
    calculated: number;
    pending: number;
    errors: number;
    excluded: number;
    low_income_exempt_count?: number;
    totals: {
        gross: string;
        deductions: string;
        net: string;
        employer_costs: string;
        tax?: number;
        total_reliefs?: number;
    };
}

export interface PayrollReportData {
    summary: Record<string, number | string>;
    breakdown: Record<string, unknown>[];
    generated_at: string;
}

export interface BankScheduleValidation {
    valid_count: number;
    invalid_count: number;
    valid: BankScheduleItem[];
    invalid: BankScheduleInvalidItem[];
    total_valid_amount: number;
    can_generate: boolean;
}

export interface BankScheduleItem {
    employee_id: number;
    employee_name: string;
    bank_name: string;
    bank_code: string;
    account_number: string;
    amount: number;
}

export interface BankScheduleInvalidItem {
    employee_id: number;
    employee_name: string;
    errors: string[];
    amount: number;
}

export type PayRunStatus =
    | 'draft'
    | 'calculating'
    | 'pending_review'
    | 'pending_approval'
    | 'approved'
    | 'processing'
    | 'completed'
    | 'cancelled';

export type PayRunItemStatus = 'pending' | 'calculated' | 'error' | 'excluded';

export type EarningCategory =
    | 'base'
    | 'allowance'
    | 'bonus'
    | 'commission'
    | 'overtime'
    | 'other';

export type EarningCalculationType =
    | 'fixed'
    | 'percentage'
    | 'hourly'
    | 'formula';

export type DeductionCategory =
    | 'statutory'
    | 'voluntary'
    | 'loan'
    | 'advance'
    | 'other';

export type DeductionCalculationType =
    | 'fixed'
    | 'percentage'
    | 'tiered'
    | 'formula';

export type DeductionCalculationBase =
    | 'gross'
    | 'basic'
    | 'taxable'
    | 'pensionable'
    | 'net';

export interface EnumOption {
    value: string;
    label: string;
    description?: string;
}

/**
 * NTA 2025 Tax System Types
 * These types support the transition from PITA 2011 to NTA 2025
 */

export type TaxLawVersion = 'pita_2011' | 'nta_2025';

export type TaxReliefType =
    | 'fixed'
    | 'percentage'
    | 'capped_percentage'
    | 'cra'
    | 'rent_relief'
    | 'low_income_exemption';

export type ProofStatus = 'valid' | 'expired' | 'missing';

export interface EmployeeTaxSettings {
    id: number;
    user_id: number;
    tenant_id: number;
    tax_id_number: string | null;
    tax_state: string | null;
    is_tax_exempt: boolean;
    exemption_reason: string | null;
    exemption_expires_at: string | null;
    is_homeowner: boolean;
    annual_rent_paid: number | null;
    rent_proof_document: string | null;
    rent_proof_expiry: string | null;
    active_reliefs: string[];
    relief_claims: ReliefClaim[] | null;
    low_income_auto_exempt: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReliefClaim {
    code: string;
    amount: number;
    period: string;
    claimed_at: string;
}

export interface AppliedRelief {
    code: string;
    name: string;
    amount: number;
    requires_proof?: boolean;
    proof_status?: ProofStatus;
}

export interface TaxBandBreakdown {
    band_order: number;
    min_amount: number;
    max_amount: number | null;
    rate: number;
    tax_amount: number;
}

export interface TaxCalculationResult {
    tax: number;
    annual_tax: number;
    taxable_income: number;
    annual_taxable_income: number;
    total_reliefs: number;
    reliefs_applied: AppliedRelief[];
    band_breakdown: TaxBandBreakdown[];
    is_exempt: boolean;
    is_low_income_exempt?: boolean;
    exemption_reason?: string;
    tax_law_version: TaxLawVersion | null;
    effective_date?: string;
    error?: string;
}

export interface TaxEstimate {
    gross_salary: number;
    total_reliefs: number;
    reliefs_applied?: AppliedRelief[];
    taxable_income: number;
    annual_tax: number;
    monthly_tax: number;
    effective_rate: number;
    is_low_income_exempt: boolean;
    tax_law_version: TaxLawVersion | null;
    band_breakdown: TaxBandBreakdown[];
}

export interface TaxLawComparison {
    pita_2011: TaxEstimate;
    nta_2025: TaxEstimate;
}

export interface TaxLawVersionOption {
    value: TaxLawVersion;
    label: string;
    short_label: string;
}

export interface TaxSettingsPageProps {
    employee: {
        id: number;
        name: string;
        email: string;
    };
    taxSettings: EmployeeTaxSettings;
    availableReliefs: TaxRelief[];
    taxSummary: TaxCalculationResult | { error: string };
    taxLawVersion: TaxLawVersion | null;
    taxLawLabel: string | null;
}

export interface PayrollTaxSettingsPageProps {
    taxTables: (TaxTable & {
        tax_law_version_label?: string;
        is_current?: boolean;
    })[];
    currentTable: TaxTable | null;
    taxLawVersions: TaxLawVersionOption[];
    nta2025Countdown: number;
}

export interface TaxTableShowPageProps {
    taxTable: TaxTable;
}

export type TaxConfigurationStatusType =
    | 'not_configured'
    | 'partial'
    | 'complete';

export type TaxConfigurationStatusColor = 'warning' | 'info' | 'success';

export interface TaxConfigurationStatus {
    status: TaxConfigurationStatusType;
    label: string;
    color: TaxConfigurationStatusColor;
    is_homeowner: boolean | null;
    has_rent_proof: boolean;
}
