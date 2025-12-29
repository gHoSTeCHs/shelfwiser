import type { Shop } from './shop';
import type {
    EmploymentType,
    PayType,
    PayFrequency,
    TaxHandling,
    EmployeePayrollDetail,
} from './payroll';

export interface Role {
    value: string;
    label: string;
    description: string;
    level: number;
    can_access_multiple_shops: boolean;
}

export interface PayCalendar {
    id: number;
    name: string;
    frequency: PayFrequency;
    pay_day: number;
    is_default: boolean;
}

export interface StaffMember {
    id: number;
    tenant_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    role: string;
    role_label: string;
    role_level: number;
    is_active: boolean;
    is_tenant_owner: boolean;
    onboarding_status: 'pending' | 'in_progress' | 'completed';
    onboarded_at: string | null;
    shops: Shop[];
    employee_payroll_detail: EmployeePayrollDetail | null;
    created_at: string;
    updated_at: string;
}

export interface CreateStaffFormData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    shop_ids: number[];
    send_invitation: boolean;

    employment_type: EmploymentType;
    position_title: string;
    department: string;
    start_date: string;
    end_date: string | null;

    pay_type: PayType;
    pay_amount: string;
    pay_frequency: PayFrequency;
    pay_calendar_id: number | null;
    standard_hours_per_week: string;
    commission_rate: string | null;
    commission_cap: string | null;

    tax_handling: TaxHandling;
    tax_id_number: string;
    pension_enabled: boolean;
    pension_employee_rate: string;
    nhf_enabled: boolean;
    nhis_enabled: boolean;

    bank_name: string;
    bank_account_number: string;
    routing_number: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
}

export interface UpdateStaffFormData extends Partial<CreateStaffFormData> {
    is_active?: boolean;
}

export interface StaffFormProps {
    roles: Array<{
        value: string;
        label: string;
        level: number;
        description: string;
    }>;
    shops: Shop[];
    payCalendars: Array<{ id: number; name: string; frequency: string }>;
    departments: string[];
    templates: EmployeeTemplate[];
    initialData?: Partial<CreateStaffFormData>;
    errors: Record<string, string>;
    processing: boolean;
}

export interface EmployeeTemplate {
    id: number;
    tenant_id: number | null;
    name: string;
    description: string | null;
    is_system: boolean;
    role: string;
    role_label: string;
    employment_type: EmploymentType;
    employment_type_label: string;
    position_title: string;
    department: string | null;
    pay_type: PayType;
    pay_type_label: string;
    pay_amount: string;
    pay_frequency: PayFrequency;
    pay_frequency_label: string;
    standard_hours_per_week: string;
    commission_rate: string | null;
    commission_cap: string | null;
    tax_handling: TaxHandling | null;
    pension_enabled: boolean;
    pension_employee_rate: string;
    nhf_enabled: boolean;
    nhis_enabled: boolean;
    usage_count: number;
    created_at: string;
    updated_at: string;
}

export interface EmployeeTemplateFormData {
    role: string;
    employment_type: EmploymentType;
    position_title: string;
    department: string;
    pay_type: PayType;
    pay_amount: string;
    pay_frequency: PayFrequency;
    standard_hours_per_week: string;
    commission_rate: string;
    commission_cap: string;
    tax_handling: TaxHandling;
    pension_enabled: boolean;
    pension_employee_rate: string;
    nhf_enabled: boolean;
    nhis_enabled: boolean;
}

export const EMPLOYMENT_TYPE_OPTIONS = [
    {
        value: 'full_time',
        label: 'Full Time',
        description: 'Regular full-time employee',
    },
    {
        value: 'part_time',
        label: 'Part Time',
        description: 'Works less than standard hours',
    },
    {
        value: 'contract',
        label: 'Contract',
        description: 'Fixed-term employment contract',
    },
    {
        value: 'seasonal',
        label: 'Seasonal',
        description: 'Employed during peak seasons',
    },
    {
        value: 'intern',
        label: 'Intern',
        description: 'Training/internship position',
    },
] as const;

export const PAY_TYPE_OPTIONS = [
    {
        value: 'salary',
        label: 'Salary',
        description: 'Fixed monthly compensation',
    },
    {
        value: 'hourly',
        label: 'Hourly',
        description: 'Paid per hour worked',
    },
    {
        value: 'daily',
        label: 'Daily',
        description: 'Paid per day worked',
    },
    {
        value: 'commission_based',
        label: 'Commission',
        description: 'Earnings based on sales',
    },
] as const;

export const PAY_FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-Weekly' },
    { value: 'semi_monthly', label: 'Semi-Monthly' },
    { value: 'monthly', label: 'Monthly' },
] as const;

export const TAX_HANDLING_OPTIONS = [
    {
        value: 'shop_calculates',
        label: 'Shop Calculates (PAYE)',
        description: 'Shop calculates and withholds tax',
    },
    {
        value: 'employee_calculates',
        label: 'Employee Handles',
        description: 'Employee is responsible for own taxes',
    },
    {
        value: 'exempt',
        label: 'Tax Exempt',
        description: 'Employee is exempt from income tax',
    },
] as const;

export const DEFAULT_STAFF_FORM_DATA: CreateStaffFormData = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    shop_ids: [],
    send_invitation: false,

    employment_type: 'full_time',
    position_title: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,

    pay_type: 'salary',
    pay_amount: '',
    pay_frequency: 'monthly',
    pay_calendar_id: null,
    standard_hours_per_week: '40',
    commission_rate: null,
    commission_cap: null,

    tax_handling: 'shop_calculates',
    tax_id_number: '',
    pension_enabled: false,
    pension_employee_rate: '8',
    nhf_enabled: false,
    nhis_enabled: false,

    bank_name: '',
    bank_account_number: '',
    routing_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
};

export const NIGERIAN_BANKS = [
    'Access Bank',
    'Citibank Nigeria',
    'Ecobank Nigeria',
    'Fidelity Bank',
    'First Bank of Nigeria',
    'First City Monument Bank',
    'Globus Bank',
    'Guaranty Trust Bank',
    'Heritage Bank',
    'Keystone Bank',
    'Kuda Bank',
    'Moniepoint',
    'OPay',
    'PalmPay',
    'Polaris Bank',
    'Providus Bank',
    'Stanbic IBTC Bank',
    'Standard Chartered Bank',
    'Sterling Bank',
    'SunTrust Bank',
    'Titan Trust Bank',
    'Union Bank of Nigeria',
    'United Bank for Africa',
    'Unity Bank',
    'VFD Microfinance Bank',
    'Wema Bank',
    'Zenith Bank',
] as const;

export const COMMON_DEPARTMENTS = [
    'Sales',
    'Operations',
    'Finance',
    'Human Resources',
    'Customer Service',
    'Inventory',
    'Management',
    'Marketing',
    'IT',
    'Logistics',
] as const;

export const COMMON_POSITIONS = [
    'Sales Associate',
    'Cashier',
    'Store Manager',
    'Assistant Manager',
    'Inventory Clerk',
    'Stock Controller',
    'Customer Service Rep',
    'Supervisor',
    'Team Lead',
    'General Manager',
] as const;

export interface StaffCreatePageProps {
    roles: Role[];
    shops: Shop[];
    payCalendars: PayCalendar[];
    employmentTypes: Array<{ value: string; label: string }>;
    payTypes: Array<{ value: string; label: string }>;
    payFrequencies: Array<{ value: string; label: string }>;
    taxHandlingOptions: Array<{ value: string; label: string }>;
    departments: string[];
    templates: EmployeeTemplate[];
}

export interface StaffEditPageProps extends StaffCreatePageProps {
    staff: StaffMember;
    canManagePayroll: boolean;
}

export function applyTemplateToForm(
    template: EmployeeTemplate,
    currentData: CreateStaffFormData,
): CreateStaffFormData {
    return {
        ...currentData,
        role: template.role,
        employment_type: template.employment_type,
        position_title: template.position_title,
        department: template.department || '',
        pay_type: template.pay_type,
        pay_amount: template.pay_amount,
        pay_frequency: template.pay_frequency,
        standard_hours_per_week: template.standard_hours_per_week,
        commission_rate: template.commission_rate,
        commission_cap: template.commission_cap,
        tax_handling: template.tax_handling || 'shop_calculates',
        pension_enabled: template.pension_enabled,
        pension_employee_rate: template.pension_employee_rate,
        nhf_enabled: template.nhf_enabled,
        nhis_enabled: template.nhis_enabled,
    };
}

export function formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₦0';
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

export function requiresEndDate(employmentType: EmploymentType): boolean {
    return ['contract', 'seasonal', 'intern'].includes(employmentType);
}

export function isCommissionBased(payType: PayType): boolean {
    return payType === 'commission_based';
}
