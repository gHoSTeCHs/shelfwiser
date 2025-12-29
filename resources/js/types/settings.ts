import { Shop } from './shop';
import { TaxHandling, PayFrequency } from './payroll';

export interface TaxJurisdiction {
    id: number;
    name: string;
    code: string;
    country: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ShopTaxSetting {
    id: number;
    shop_id: number;
    tenant_id: number;
    tax_jurisdiction_id: number | null;
    enable_tax_calculations: boolean;
    default_tax_handling: TaxHandling;
    overtime_threshold_hours: number;
    overtime_multiplier: number;
    default_payroll_frequency: PayFrequency;
    wage_advance_max_percentage: number;
    default_pension_enabled: boolean;
    default_nhf_enabled: boolean;
    default_nhis_enabled: boolean;
    created_at: string;
    updated_at: string;

    shop?: Shop;
    taxJurisdiction?: TaxJurisdiction;
}
