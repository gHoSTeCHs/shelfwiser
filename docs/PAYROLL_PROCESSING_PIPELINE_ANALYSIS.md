# Payroll Processing Pipeline - Comprehensive Analysis Report

**Analysis Date:** December 2024 (Updated: January 2026)
**System Version:** ShelfWise Beta
**Analysis Scope:** Full-stack (Backend + Frontend)
**Last Verification:** January 15, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Backend Analysis](#backend-analysis)
   - [Models](#models)
   - [Enums](#enums)
   - [Controllers](#controllers)
   - [Services](#services)
   - [Form Requests](#form-requests)
   - [Migrations](#migrations)
4. [Frontend Analysis](#frontend-analysis)
   - [React Pages](#react-pages)
   - [TypeScript Types](#typescript-types)
   - [UI Components](#ui-components)
   - [Form Implementation](#form-implementation)
   - [Dark Mode](#dark-mode)
   - [UX Patterns](#ux-patterns)
5. [Calculation Flow Analysis](#calculation-flow-analysis)
6. [Critical Issues & Flaws](#critical-issues--flaws)
7. [Optimization Concerns](#optimization-concerns)
8. [Recommendations](#recommendations)
9. [Risk Assessment](#risk-assessment)

---

## Executive Summary

The Payroll Processing Pipeline is an **enterprise-grade compensation management system** handling the complete payroll lifecycle from employee configuration through pay run processing, tax calculations, and payslip generation. The system implements Nigerian tax regulations (PAYE, CRA) and supports multiple pay frequencies.

### Overall Assessment

| Aspect | Score | Status |
|--------|-------|--------|
| Architecture | 8/10 | Good |
| Backend Logic | 8/10 | Good |
| Frontend Code | 8/10 | Good |
| Type Safety | 8/10 | Good |
| Dark Mode | 9.5/10 | Excellent |
| Tax Calculations | 8/10 | Good |
| Performance | 7/10 | Acceptable |
| Completeness | 8/10 | Good |

### Key Findings

- **0 Critical Issues** - Previously reported critical issues verified as false positives
- **2 High Priority Issues** - Formula evaluation placeholder, transaction wrapping
- **6 Medium Priority Issues** for code quality improvements
- **Excellent dark mode coverage** across all components
- **Well-structured service layer** with clear separation of concerns
- **Tax calculation logic** correctly implements Nigerian PAYE with NTA 2025 support
- **PayRun system consolidated** - Legacy PayrollService properly deprecated

---

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PAYROLL PROCESSING PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │      TENANT      │
                              └────────┬─────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│      USER       │          │      SHOP       │          │  PAY CALENDAR   │
│   (Employee)    │          │                 │          │                 │
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         ▼                            │                            │
┌─────────────────┐                   │                            │
│   EMPLOYEE      │                   │                            │
│ PAYROLL DETAIL  │                   │                            │
│ ─────────────── │                   │                            │
│ • Pay Type      │                   │                            │
│ • Base Salary   │                   │                            │
│ • Tax Settings  │                   │                            │
│ • Bank Details  │                   │                            │
└────────┬────────┘                   │                            │
         │                            │                            │
         │    ┌───────────────────────┴────────────────────────────┘
         │    │
         ▼    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PAYROLL PERIOD                                      │
│ ─────────────────────────────────────────────────────────────────────────────── │
│  Status: draft → processing → processed → approved → paid                       │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 PAY RUN                                          │
│ ─────────────────────────────────────────────────────────────────────────────── │
│  Status: draft → calculating → pending_review → pending_approval → approved →   │
│          processing → completed                                                  │
│                                                                                  │
│  FOR EACH EMPLOYEE:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          PAY RUN ITEM                                    │   │
│  │ ─────────────────────────────────────────────────────────────────────── │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │   │
│  │  │  EARNINGS   │ +  │ DEDUCTIONS  │ +  │    TAX      │ = NET PAY       │   │
│  │  │  SERVICE    │    │  SERVICE    │    │  SERVICE    │                  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                PAYSLIP                                           │
│ ─────────────────────────────────────────────────────────────────────────────── │
│  • Earnings Breakdown (JSON)                                                     │
│  • Deductions Breakdown (JSON)                                                   │
│  • Tax Calculation (JSON)                                                        │
│  • Net Pay                                                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Calculation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAY RUN CALCULATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ STEP 1: EARNINGS CALCULATION (EarningsService)                              │
  │ ─────────────────────────────────────────────────────────────────────────── │
  │  ├─ Get active earnings for employee                                        │
  │  ├─ Add base salary from EmployeePayrollDetail                             │
  │  ├─ Calculate each earning type:                                            │
  │  │   ├─ FIXED: Direct amount                                               │
  │  │   ├─ PERCENTAGE: base_salary × rate                                     │
  │  │   ├─ HOURLY: hours × hourly_rate                                        │
  │  │   └─ FORMULA: Custom calculation (placeholder)                          │
  │  ├─ Track: total_gross, total_taxable, total_pensionable                   │
  │  └─ Return: earnings_breakdown[]                                           │
  └─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ STEP 2: DEDUCTIONS CALCULATION (DeductionsService)                          │
  │ ─────────────────────────────────────────────────────────────────────────── │
  │  ├─ Split into PRE-TAX and POST-TAX deductions                             │
  │  ├─ PRE-TAX deductions (reduce taxable income):                            │
  │  │   ├─ Pension (employee contribution)                                    │
  │  │   ├─ NHF (National Housing Fund)                                        │
  │  │   └─ Other pre-tax voluntary deductions                                 │
  │  ├─ Calculate pre-tax amounts                                              │
  │  ├─ Update taxable_amount = gross - pre_tax_total                          │
  │  ├─ POST-TAX deductions:                                                   │
  │  │   ├─ Loan repayments                                                    │
  │  │   ├─ Wage advance repayments                                            │
  │  │   └─ Voluntary deductions                                               │
  │  └─ Return: deductions_breakdown[] (pre-tax and post-tax flagged)          │
  └─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ STEP 3: TAX CALCULATION (TaxCalculationService)                             │
  │ ─────────────────────────────────────────────────────────────────────────── │
  │  ├─ Check employee tax exemption (return 0 if exempt)                      │
  │  ├─ Annualize monthly amounts (× 12)                                       │
  │  ├─ Calculate CRA (Consolidated Relief Allowance):                         │
  │  │   └─ Formula: max((gross × 1%) + ₦200,000, gross × 20%)                │
  │  ├─ Apply automatic reliefs from TaxTable                                  │
  │  ├─ Apply employee-specific reliefs from EmployeeTaxSetting               │
  │  ├─ Calculate taxable income:                                              │
  │  │   └─ annual_gross - pre_tax_deductions - total_reliefs                 │
  │  ├─ Apply progressive tax bands:                                           │
  │  │   ├─ Band 1: ₦300,000 @ 7%                                             │
  │  │   ├─ Band 2: ₦300,000 @ 11%                                            │
  │  │   ├─ Band 3: ₦500,000 @ 15%                                            │
  │  │   ├─ Band 4: ₦500,000 @ 19%                                            │
  │  │   ├─ Band 5: ₦1,600,000 @ 21%                                          │
  │  │   └─ Band 6: Above ₦3,200,000 @ 24%                                    │
  │  ├─ Calculate annual tax                                                   │
  │  └─ Return: monthly_tax = annual_tax / 12                                  │
  └─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ STEP 4: NET PAY CALCULATION                                                 │
  │ ─────────────────────────────────────────────────────────────────────────── │
  │  NET PAY = GROSS_PAY - PRE_TAX_DEDUCTIONS - TAX - POST_TAX_DEDUCTIONS      │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Status State Machines

```
PAYROLL PERIOD STATUS:
┌────────┐    ┌────────────┐    ┌───────────┐    ┌──────────┐    ┌────────┐
│ DRAFT  │───►│ PROCESSING │───►│ PROCESSED │───►│ APPROVED │───►│  PAID  │
└────────┘    └────────────┘    └───────────┘    └──────────┘    └────────┘
                    │                                                  │
                    └──────────────────┐                               │
                                       ▼                               │
                               ┌───────────┐                           │
                               │ CANCELLED │◄──────────────────────────┘
                               └───────────┘

PAY RUN STATUS:
┌───────┐   ┌─────────────┐   ┌────────────────┐   ┌──────────────────┐
│ DRAFT │──►│ CALCULATING │──►│ PENDING_REVIEW │──►│ PENDING_APPROVAL │
└───────┘   └─────────────┘   └────────────────┘   └──────────────────┘
                                                            │
                 ┌──────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────┐    ┌────────────┐    ┌───────────┐
         │ APPROVED │───►│ PROCESSING │───►│ COMPLETED │
         └──────────┘    └────────────┘    └───────────┘
                                                 │
                                                 ▼
                                          ┌───────────┐
                                          │ CANCELLED │
                                          └───────────┘

PAY RUN ITEM STATUS:
┌─────────┐    ┌────────────┐
│ PENDING │───►│ CALCULATED │
└─────────┘    └────────────┘
     │              │
     ▼              ▼
┌─────────┐    ┌──────────┐
│  ERROR  │    │ EXCLUDED │
└─────────┘    └──────────┘
```

---

## Backend Analysis

### Models

#### File Inventory

| Model | Path | Purpose |
|-------|------|---------|
| Payslip | `app/Models/Payslip.php` | Individual employee pay records |
| PayRun | `app/Models/PayRun.php` | Batch payroll calculation master |
| PayRunItem | `app/Models/PayRunItem.php` | Single employee in pay run |
| PayrollPeriod | `app/Models/PayrollPeriod.php` | Pay period definition |
| EmployeePayrollDetail | `app/Models/EmployeePayrollDetail.php` | Employee pay configuration |
| EarningType | `app/Models/EarningType.php` | Earning type definitions |
| EmployeeEarning | `app/Models/EmployeeEarning.php` | Employee-specific earnings |
| DeductionTypeModel | `app/Models/DeductionTypeModel.php` | Deduction type definitions |
| EmployeeDeduction | `app/Models/EmployeeDeduction.php` | Employee-specific deductions |
| EmployeeCustomDeduction | `app/Models/EmployeeCustomDeduction.php` | Ad-hoc deductions |
| TaxTable | `app/Models/TaxTable.php` | Tax bracket configuration |
| TaxBand | `app/Models/TaxBand.php` | Progressive tax bands |
| TaxRelief | `app/Models/TaxRelief.php` | Tax relief definitions |
| EmployeeTaxSetting | `app/Models/EmployeeTaxSetting.php` | Employee tax config |
| PayCalendar | `app/Models/PayCalendar.php` | Pay schedule definitions |
| WageAdvance | `app/Models/WageAdvance.php` | Salary advance requests |
| WageAdvanceRepayment | `app/Models/WageAdvanceRepayment.php` | Advance repayments |
| Timesheet | `app/Models/Timesheet.php` | Employee work hours |
| FundRequest | `app/Models/FundRequest.php` | General fund requests |
| ApprovalRequest | `app/Models/ApprovalRequest.php` | Generic approval workflow |
| ApprovalChain | `app/Models/ApprovalChain.php` | Approval rule definitions |

---

#### Payslip Model

**Path:** `app/Models/Payslip.php`

**Schema:**
```
├── Core Identifiers
│   ├── tenant_id, shop_id, user_id
│   ├── payroll_period_id, pay_run_id
│   └── status
├── Earnings
│   ├── basic_salary
│   ├── regular_hours, regular_pay
│   ├── overtime_hours, overtime_pay
│   ├── bonus, commission
│   └── gross_pay (calculated)
├── Deductions
│   ├── income_tax
│   ├── pension_employee, pension_employer
│   ├── nhf, nhis
│   ├── wage_advance_deduction
│   ├── other_deductions
│   └── total_deductions (calculated)
├── Net Pay
│   └── net_pay = gross_pay - total_deductions
└── Breakdowns (JSON)
    ├── earnings_breakdown
    ├── deductions_breakdown
    └── tax_calculation
```

**Key Methods:**
- `getTotalEarnings()` - Sum all earning components
- `getEmployerContributions()` - Calculate employer-side costs
- `cancel()` - Mark payslip as cancelled

**Issue Identified:**
> `cancel()` method uses hardcoded string 'cancelled' instead of enum - inconsistent with PayRunStatus enum pattern.

---

#### PayRun Model

**Path:** `app/Models/PayRun.php`

**Schema:**
```
├── reference (auto-generated unique)
├── tenant_id, payroll_period_id, pay_calendar_id
├── status (enum)
├── Totals
│   ├── total_gross, total_deductions
│   ├── total_net, total_employer_costs
│   └── employee_count
├── Audit Trail
│   ├── calculated_by, calculated_at
│   ├── approved_by, approved_at
│   └── completed_by, completed_at
└── metadata (JSON)
```

**Key Methods:**
- `generateReference()` - DB transaction-locked unique ref generation
- `updateTotals()` - Aggregates from PayRunItems
- `canBeCalculated()`, `canBeApproved()`, `canBeCompleted()`

**Critical Issue:**
> Line 189: `updateTotals()` filters by status string 'calculated' instead of `PayRunItemStatus::CALCULATED` enum.

**Logic Issue:**
> `canBeCalculated()` checks for PENDING_REVIEW status, but line 80 updates to PENDING_REVIEW - potential state loop if calculation fails and retries.

---

#### EmployeePayrollDetail Model

**Path:** `app/Models/EmployeePayrollDetail.php`

**Schema:**
```
├── Employment Info
│   ├── employment_type (full_time/part_time/contract/seasonal/intern)
│   ├── pay_type (salary/hourly/daily/commission_based)
│   ├── pay_amount, pay_frequency
│   └── standard_hours_per_week
├── Multipliers
│   ├── overtime_multiplier (default: 1.5)
│   ├── weekend_multiplier (default: 2.0)
│   └── holiday_multiplier (default: 2.5)
├── Commission
│   ├── commission_rate
│   └── commission_cap
├── Tax Configuration
│   ├── tax_handling
│   ├── tax_id_number (encrypted)
│   └── tax_state
├── Pension
│   ├── pension_enabled
│   ├── pension_employee_rate (default: 8%)
│   └── pension_employer_rate (default: 10%)
├── NHF
│   ├── nhf_enabled
│   └── nhf_rate (default: 2.5%)
└── Bank Details (encrypted)
    ├── bank_name, bank_account_number
    └── routing_number
```

**Calculation Methods:**
- `getMonthlyHours()` - Uses 4.33 weeks/month constant
- `calculateHourlyRate()` - Derives from monthly salary
- `calculateCommission($sales)` - Applies rate with cap
- `calculateOvertimePay($hours)` - Applies multiplier
- `calculateWeekendPay($hours)` - Applies weekend multiplier
- `calculateHolidayPay($hours)` - Applies holiday multiplier

---

#### TaxTable & TaxBand Models

**TaxTable Schema:**
```
├── name, jurisdiction, effective_year
├── is_system, is_active
└── Relationships
    ├── hasMany: TaxBand
    ├── hasMany: TaxRelief
    └── hasMany: automaticReliefs (filtered)
```

**TaxBand Schema:**
```
├── min_amount, max_amount
├── rate (percentage)
├── cumulative_tax (legacy/unused)
└── band_order
```

**Tax Calculation Formula:**
```php
foreach ($bands as $band) {
    $taxableInBand = min($income, $band->max_amount) - $band->min_amount;
    $tax += $taxableInBand * ($band->rate / 100);
}
```

**TaxRelief Types:**
- `FIXED` - Direct amount reduction
- `PERCENTAGE` - Percentage of gross
- `CAPPED_PERCENTAGE` - Percentage with maximum cap

---

### Enums

| Enum | Path | Cases |
|------|------|-------|
| PayFrequency | `app/Enums/PayFrequency.php` | daily, weekly, bi_weekly, semi_monthly, monthly |
| PayType | `app/Enums/PayType.php` | salary, hourly, daily, commission_based |
| PayRunStatus | `app/Enums/PayRunStatus.php` | draft, calculating, pending_review, pending_approval, approved, processing, completed, cancelled |
| PayRunItemStatus | `app/Enums/PayRunItemStatus.php` | pending, calculated, error, excluded |
| PayrollStatus | `app/Enums/PayrollStatus.php` | draft, processing, processed, approved, paid, cancelled |
| EarningCategory | `app/Enums/EarningCategory.php` | base, allowance, bonus, commission, overtime, other |
| EarningCalculationType | `app/Enums/EarningCalculationType.php` | fixed, percentage, hourly, formula |
| DeductionCategory | `app/Enums/DeductionCategory.php` | statutory, voluntary, loan, advance, other |
| DeductionCalculationType | `app/Enums/DeductionCalculationType.php` | fixed, percentage, tiered, formula |
| DeductionCalculationBase | `app/Enums/DeductionCalculationBase.php` | gross, basic, taxable, pensionable, net |
| WageAdvanceStatus | `app/Enums/WageAdvanceStatus.php` | pending, approved, rejected, disbursed, repaying, repaid, cancelled |
| TimesheetStatus | `app/Enums/TimesheetStatus.php` | draft, submitted, approved, rejected, paid |
| TaxReliefType | `app/Enums/TaxReliefType.php` | fixed, percentage, capped_percentage |

**Critical Issue:**
> PayRunStatus enum does not define `CALCULATING` case, but PayRun model references `STATUS_CALCULATING` constant. This will cause runtime errors when casting.

---

### Services

#### PayRunService

**Path:** `app/Services/PayRunService.php`

**Key Methods:**

| Method | Purpose | Issues |
|--------|---------|--------|
| `createPayRun()` | Creates pay run with employee items | Uses DB::transaction - good |
| `calculatePayRun()` | Orchestrates calculation for all employees | Updates to CALCULATING status (enum mismatch) |
| `calculateEmployeePay()` | Core calculation for single employee | No validation of positive earnings |
| `recalculateItem()` | Recalculates single employee | Proper total update |

**Calculation Flow:**
```php
calculatePayRun($payRun)
├── Update status to CALCULATING
├── For each processable item:
│   └── calculateEmployeePay($item, $payRun)
│       ├── EarningsService->calculateEmployeeEarnings()
│       ├── DeductionsService->calculateEmployeeDeductions()
│       └── TaxCalculationService->calculateMonthlyPAYE()
├── PayRun->updateTotals()
├── Update status to PENDING_REVIEW
└── Clear tenant cache
```

---

#### TaxCalculationService

**Path:** `app/Services/TaxCalculationService.php`

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `calculateMonthlyPAYE()` | Primary PAYE tax calculation |
| `calculateCRA()` | Consolidated Relief Allowance |
| `calculateAnnualTax()` | Wrapper for tax table calculation |
| `getEffectiveTaxRate()` | Calculate effective tax percentage |
| `getTaxSummaryForEmployee()` | Get employee's monthly tax estimate |
| `estimateTaxForSalary()` | Project tax on proposed salary |

**CRA Formula (Nigerian Tax):**
```php
public function calculateCRA(float $annualGross): float
{
    $onePercent = $annualGross * 0.01;
    $fixed = 200000;
    $twentyPercent = $annualGross * 0.20;

    return max($onePercent + $fixed, $twentyPercent);
}
```

**Issues Identified:**
- Hardcoded ₦200,000 CRA fixed amount - should be configurable
- Hardcoded 1% and 20% percentages - should reference TaxRelief records
- CRA applied twice risk - both in TaxRelief and TaxCalculationService

---

#### EarningsService

**Path:** `app/Services/EarningsService.php`

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `getActiveEarnings()` | Retrieve active earnings as of date |
| `calculateEmployeeEarnings()` | Calculate all earnings with breakdown |
| `assignEarning()` | Create employee earning record |

**Calculation Logic:**
```php
foreach ($activeEarnings as $earning) {
    $amount = match($earning->earningType->calculation_type) {
        'FIXED' => $earning->amount,
        'PERCENTAGE' => $baseSalary * ($earning->rate / 100),
        'HOURLY' => $context['hours'] * $earning->rate,
        'FORMULA' => 0, // Placeholder - not implemented
    };

    if ($earning->earningType->is_taxable) {
        $totals['total_taxable'] += $amount;
    }
    if ($earning->earningType->is_pensionable) {
        $totals['total_pensionable'] += $amount;
    }
}
```

**Issue:** Formula evaluation returns 0 - incomplete implementation.

---

#### DeductionsService

**Path:** `app/Services/DeductionsService.php`

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `getActiveDeductions()` | Retrieve active deductions sorted by priority |
| `calculateEmployeeDeductions()` | Calculate all deductions with pre/post-tax split |

**Pre-Tax vs Post-Tax Flow:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEDUCTION CALCULATION ORDER                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. PRE-TAX DEDUCTIONS (reduce taxable income):                     │
│     ├─ Pension (employee contribution)                              │
│     ├─ NHF (National Housing Fund)                                  │
│     └─ Other pre-tax voluntary                                      │
│                                                                      │
│  2. UPDATE TAXABLE AMOUNT:                                          │
│     taxable = gross - pre_tax_total                                 │
│                                                                      │
│  3. TAX CALCULATION (on reduced taxable)                            │
│                                                                      │
│  4. POST-TAX DEDUCTIONS:                                            │
│     ├─ Loan repayments                                              │
│     ├─ Wage advance repayments                                      │
│     └─ Voluntary deductions                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Critical Issue:**
> Line 88: Modifies `$amounts['taxable']` array in place - could affect subsequent service calls if same array is reused.

---

#### WageAdvanceService

**Path:** `app/Services/WageAdvanceService.php`

**Eligibility Calculation:**
```php
public function calculateEligibility($employee)
{
    $maxPercentage = $shopTaxSettings->max_advance_percentage ?? 30;

    $estimatedPay = match($payrollDetail->pay_type) {
        PayType::SALARY => $payrollDetail->pay_amount,
        PayType::HOURLY => $payrollDetail->pay_amount * 160,
        PayType::DAILY => $payrollDetail->pay_amount * 22,
    };

    $maxAmount = $estimatedPay * ($maxPercentage / 100);
    $existingAdvances = $this->getActiveAdvancesTotal($employee);
    $availableAmount = max(0, $maxAmount - $existingAdvances);

    return [
        'eligible' => $availableAmount > 0,
        'max_amount' => $maxAmount,
        'available_amount' => $availableAmount,
    ];
}
```

**Issue:**
> Pay amount ambiguity - `PayType::SALARY` treats pay_amount as monthly, but field could be annual for salaried employees.

---

### Migrations

**Payroll Tables:**

| Migration | Table | Key Features |
|-----------|-------|--------------|
| create_payroll_periods_table | payroll_periods | Period definition with status tracking |
| create_payslips_table | payslips | Soft deletes, JSON breakdowns |
| create_employee_payroll_details_table | employee_payroll_details | Encrypted bank/tax fields |
| create_pay_runs_table | pay_runs | Soft deletes, reference uniqueness |
| create_pay_run_items_table | pay_run_items | Unique (pay_run_id, user_id) |
| create_pay_calendars_table | pay_calendars | Pay schedule configuration |
| create_employee_tax_settings_table | employee_tax_settings | Employee tax exemptions |
| create_tax_tables_table | tax_tables | Tax bracket definitions |
| create_tax_bands_table | tax_bands | Progressive tax bands |
| create_tax_reliefs_table | tax_reliefs | Relief configurations |
| create_earning_types_table | earning_types | Earning type definitions |
| create_employee_earnings_table | employee_earnings | Employee-specific earnings |
| create_deduction_types_table | deduction_types | Deduction type definitions |
| create_employee_deductions_table | employee_deductions | Employee-specific deductions |
| create_wage_advances_table | wage_advances | Advance requests |
| create_wage_advance_repayments_table | wage_advance_repayments | Repayment tracking |
| create_timesheets_table | timesheets | Work hour tracking |

**Schema Concerns:**
- Payslips use `cascadeOnDelete` on foreign keys - deleting period cascades to payslips
- JSON fields store breakdowns without versioning
- Encrypted fields for sensitive data (good)

---

## Frontend Analysis

### React Pages

#### File Inventory (13 Core Pages)

| Page | Path | Purpose |
|------|------|---------|
| Payroll/Index | `resources/js/pages/Payroll/Index.tsx` | Payroll periods list |
| Payroll/Create | `resources/js/pages/Payroll/Create.tsx` | Create payroll period |
| Payroll/Show | `resources/js/pages/Payroll/Show.tsx` | Period details + actions |
| Payroll/MyPayslips | `resources/js/pages/Payroll/MyPayslips.tsx` | Employee payslip history |
| Payroll/Payslip | `resources/js/pages/Payroll/Payslip.tsx` | Single payslip detail |
| PayRuns/Index | `resources/js/pages/PayRuns/Index.tsx` | Pay runs list |
| PayRuns/Create | `resources/js/pages/PayRuns/Create.tsx` | Create pay run |
| PayRuns/Show | `resources/js/pages/PayRuns/Show.tsx` | Pay run details |
| Timesheets/Index | `resources/js/pages/Timesheets/Index.tsx` | Timesheet management |
| Timesheets/Approve | `resources/js/pages/Timesheets/Approve.tsx` | Timesheet approval queue |
| WageAdvances/Index | `resources/js/pages/WageAdvances/Index.tsx` | Wage advance requests |
| WageAdvances/Approve | `resources/js/pages/WageAdvances/Approve.tsx` | Advance approval queue |
| Payroll/Settings/* | `resources/js/pages/Payroll/Settings/*.tsx` | Earning/Deduction/Calendar config |
| Payroll/Reports/* | `resources/js/pages/Payroll/Reports/*.tsx` | Summary/Bank/Pension/Tax reports |

---

#### Payroll/Index.tsx

**Features:**
- KPI cards: Total Gross Pay, Deductions, Net Pay
- Filterable table by shop and status
- Status badges with color coding
- Responsive design with hidden columns on mobile
- Date formatting: en-NG locale

**State Management:**
```tsx
const [shopId, setShopId] = useState('');
const [statusFilter, setStatusFilter] = useState('');
```

**Dark Mode:** Full support with `dark:` classes throughout.

---

#### Payroll/Payslip.tsx (Payslip Detail)

**Features:**
- Employee info header + pay period info
- Two-column earnings/deductions breakdown
- Employer contributions section
- Large net pay summary card (success colored)
- Print button with `window.print()` and `print:hidden` utility

**Print Support:**
```tsx
const handlePrint = () => {
    window.print();
};

// Elements hidden from print
<Button className="print:hidden" onClick={handlePrint}>
    <Printer /> Print Payslip
</Button>
```

**Issue:** Uses `earnings_breakdown?: any` - should be properly typed.

---

#### PayRuns/Index.tsx

**Features:**
- 3-metric summary cards: Total Pay Runs, Pending Approval, Completed This Month
- Search and filter form
- Pagination support (prev_page_url, next_page_url)
- Status color mapping

**Status Colors:**
```typescript
const statusColors = {
    draft: 'light',
    calculating: 'info',
    pending_review: 'warning',
    pending_approval: 'warning',
    approved: 'success',
    processing: 'info',
    completed: 'success',
    cancelled: 'error',
};
```

---

#### Timesheets/Index.tsx

**Features:**
- Active timesheet alert (if clocked in)
- Clock in/out buttons with Form submission
- Break start/end buttons
- 4-metric summary: Total Hours, Regular Hours, OT Hours, Status counts
- Date range filters

**Form Pattern:**
```tsx
<Form action={TimesheetController.clockIn.url()} method="post">
    {({ processing }) => (
        <Button type="submit" loading={processing}>
            <Clock /> Clock In
        </Button>
    )}
</Form>
```

---

#### Settings/EarningTypes.tsx

**Features:**
- CRUD operations with modal dialog
- System-protected types (Lock icon, no edit/delete)
- Category color badges
- Checkbox toggles for taxable/pensionable/recurring/active

**Form Handler:**
```tsx
const form = useForm({
    name: '',
    code: '',
    category: 'base',
    calculation_type: 'fixed',
    // ...
});

const handleSubmit = () => {
    if (editingType) {
        form.put(PayrollSettingsController.updateEarningType.url({ id }));
    } else {
        form.post(PayrollSettingsController.storeEarningType.url());
    }
};
```

---

### TypeScript Types

**Path:** `resources/js/types/payroll.ts` (562 lines)

#### Core Interfaces

**PayrollPeriod:**
```typescript
interface PayrollPeriod {
    id: number;
    tenant_id: number;
    shop_id: number | null;
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
    status: PayrollStatus;
    total_gross_pay: string;
    total_deductions: string;
    total_net_pay: string;
    employee_count: number;
    processed_by: number | null;
    processed_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    requires_owner_approval: boolean;
    // ... relationships
}
```

**PayRun:**
```typescript
interface PayRun {
    id: number;
    reference: string;
    tenant_id: number;
    payroll_period_id: number;
    pay_calendar_id: number | null;
    status: PayRunStatus;
    total_gross: string;      // Note: string not number
    total_deductions: string;
    total_net: string;
    total_employer_costs: string;
    employee_count: number;
    metadata: Record<string, unknown>;
    items: PayRunItem[];
    // ... audit fields
}
```

**TaxCalculation:**
```typescript
interface TaxCalculation {
    gross_income: number;
    taxable_income: number;
    consolidated_relief: number;
    annual_tax: number;
    monthly_tax: number;
    effective_rate: number;
    tax_bands: TaxBandCalculation[];
}

interface TaxBandCalculation {
    band_name: string;
    min_amount: number;
    max_amount: number;
    rate: number;
    taxable_in_band: number;
    tax_for_band: number;
}
```

**Type Safety Issues:**
- Financial amounts stored as strings instead of numbers
- `any` used in Payslip.earnings_breakdown
- Metadata too loose: `Record<string, unknown>`

---

### UI Components

#### Component Usage Matrix

| Component | Source | Usage in Payroll |
|-----------|--------|------------------|
| Card | `@/components/ui/card` | KPI cards, detail sections |
| Badge | `@/components/ui/badge` | Status indicators |
| Button | `@/components/ui/button` | Actions, form submit |
| Table | Native HTML | Payroll lists |
| Form | `@inertiajs/react` | Period/PayRun creation |
| Input | `@/components/form/input` | Form fields |
| Select | `@/components/form/Select` | Filters, dropdowns |
| EmptyState | Custom | No data displays |
| Modal | Custom inline | Confirmations, CRUD forms |

#### Badge Color Mapping

```typescript
const badgeColors = {
    draft: 'light',
    processing: 'warning',
    processed: 'info',
    approved: 'success',
    paid: 'success',
    cancelled: 'error',
    pending: 'warning',
    rejected: 'error',
};
```

---

### Form Implementation

#### Pattern Analysis

**Correct Pattern (Inertia Form Component):**
```tsx
<Form action={PayrollController.store.url()} method="post">
    {({ errors, processing }) => (
        <>
            <Input name="period_name" error={!!errors.period_name} />
            <InputError message={errors.period_name} />
            <Button type="submit" disabled={processing}>
                Create
            </Button>
        </>
    )}
</Form>
```

**Modal Forms (useForm Hook):**
```tsx
const form = useForm({ name: '', code: '' });

const handleSubmit = () => {
    form.post(url, {
        onSuccess: () => setShowModal(false),
    });
};
```

**Issues:**
- Mixed controlled/uncontrolled input patterns in some forms
- No client-side validation
- Some forms use native `confirm()` instead of custom modals

---

### Dark Mode

**Status: EXCELLENT (9.5/10)**

**Pattern Used:**
```tsx
<div className="bg-white dark:bg-gray-900">
    <h1 className="text-gray-900 dark:text-white">Title</h1>
    <p className="text-gray-600 dark:text-gray-300">Description</p>
</div>

<table className="bg-white dark:bg-gray-900">
    <thead className="bg-gray-50 dark:bg-gray-800">
        <th className="text-gray-500 dark:text-gray-400">Header</th>
    </thead>
    <tbody className="divide-gray-200 dark:divide-gray-700">
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
```

**Coverage:**
- All text and heading elements
- All backgrounds (card, section, row hover)
- All borders and dividers
- Badge colors
- Form inputs
- Alert/status boxes

---

### UX Patterns

#### Approval Workflows

**Payroll Processing Workflow:**
```
1. Create payroll period (status: draft)
2. System calculates payslips → status: processing
3. Processor reviews, clicks "Process" → status: processed
4. Approver reviews, clicks "Approve" → status: approved
5. Finance clicks "Mark as Paid" → status: paid
6. Payslips visible to employees
```

**Wage Advance Approval:**
```
1. Employee requests advance
2. Appears in "Approval Queue" (pending)
3. Manager reviews in card layout
4. Clicks "Review" → navigates to Show page
5. Show page has Approve/Reject buttons
6. On approval: sets amount_approved
7. On disbursal: another approval step
8. Shows repayment schedule
```

#### Loading States

```tsx
<Button
    loading={processing}
    disabled={processing}
    onClick={handleProcess}
>
    {processing ? 'Processing...' : 'Process Payroll'}
</Button>
```

**Issue:** No skeleton loaders for page-level loading.

#### Empty States

```tsx
<EmptyState
    icon={<Calendar />}
    title="No payroll periods found"
    description="Get started by creating your first payroll period."
    action={<Button>Create Payroll Period</Button>}
/>
```

#### Confirmation Dialogs

**Native confirm() (Issue):**
```tsx
if (confirm('Are you sure?')) {
    router.post(...);
}
```

**Custom Modal (Better):**
```tsx
{showCancelDialog && (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        <Card className="w-full max-w-md p-6">
            <TextArea name="reason" value={cancelReason} />
            <Button variant="destructive" onClick={handleCancel}>
                Confirm Cancel
            </Button>
        </Card>
    </div>
)}
```

---

## Calculation Flow Analysis

### Complete Pay Run Calculation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE PAY RUN CALCULATION SEQUENCE                         │
└─────────────────────────────────────────────────────────────────────────────────┘

PayRunService.calculatePayRun($payRun)
│
├─► Update PayRun.status = CALCULATING
│
├─► For each PayRunItem where status = PENDING:
│   │
│   └─► PayRunService.calculateEmployeePay($item)
│       │
│       ├─► Get EmployeePayrollDetail
│       │   └─► If not found: mark item as ERROR, continue
│       │
│       ├─► Build calculation context:
│       │   ├─ period_start, period_end
│       │   ├─ hours_worked (from timesheets)
│       │   └─ base_salary
│       │
│       ├─► EarningsService.calculateEmployeeEarnings()
│       │   ├─ Get active earnings for period
│       │   ├─ Add base salary if no BASE earning
│       │   ├─ Calculate each earning by type:
│       │   │   ├─ FIXED: direct amount
│       │   │   ├─ PERCENTAGE: base × rate
│       │   │   ├─ HOURLY: hours × rate
│       │   │   └─ FORMULA: 0 (not implemented)
│       │   └─ Return: {
│       │       breakdown: [...],
│       │       total_gross: X,
│       │       total_taxable: Y,
│       │       total_pensionable: Z
│       │   }
│       │
│       ├─► DeductionsService.calculateEmployeeDeductions()
│       │   ├─ Split deductions: PRE-TAX vs POST-TAX
│       │   ├─ Calculate PRE-TAX first:
│       │   │   ├─ Pension (employee %)
│       │   │   ├─ NHF (2.5%)
│       │   │   └─ Other pre-tax
│       │   ├─ Update amounts.taxable -= pre_tax_total
│       │   ├─ Calculate POST-TAX:
│       │   │   ├─ Loan repayments
│       │   │   ├─ Wage advance repayments
│       │   │   └─ Voluntary deductions
│       │   └─ Return: {
│       │       breakdown: [...],
│       │       total_pre_tax: X,
│       │       total_post_tax: Y,
│       │       total_deductions: Z
│       │   }
│       │
│       ├─► TaxCalculationService.calculateMonthlyPAYE()
│       │   ├─ Check tax exemption → return 0 if exempt
│       │   ├─ Annualize: annual_gross = monthly × 12
│       │   ├─ Calculate CRA:
│       │   │   └─ max((gross × 1%) + ₦200,000, gross × 20%)
│       │   ├─ Apply automatic reliefs from TaxTable
│       │   ├─ Apply employee reliefs from EmployeeTaxSetting
│       │   ├─ Calculate taxable:
│       │   │   └─ annual_gross - pre_tax_annual - total_reliefs
│       │   ├─ Apply tax bands:
│       │   │   ├─ Band 1: ₦300,000 @ 7%
│       │   │   ├─ Band 2: ₦300,000 @ 11%
│       │   │   ├─ Band 3: ₦500,000 @ 15%
│       │   │   ├─ Band 4: ₦500,000 @ 19%
│       │   │   ├─ Band 5: ₦1,600,000 @ 21%
│       │   │   └─ Band 6: Above @ 24%
│       │   └─ Return: monthly_tax = annual_tax / 12
│       │
│       ├─► Calculate net_pay:
│       │   └─ gross - pre_tax - tax - post_tax
│       │
│       ├─► Update PayRunItem:
│       │   ├─ gross_pay, net_pay
│       │   ├─ earnings_breakdown (JSON)
│       │   ├─ deductions_breakdown (JSON)
│       │   ├─ tax_calculation (JSON)
│       │   └─ status = CALCULATED
│       │
│       └─► Return success
│
├─► PayRun.updateTotals()
│   ├─ Sum all CALCULATED items
│   └─ Update: total_gross, total_deductions, total_net
│
├─► Update PayRun.status = PENDING_REVIEW
│
└─► Clear tenant cache
```

---

## Critical Issues & Flaws

### VERIFIED FALSE POSITIVES (January 2026)

The following issues were originally reported as critical but have been **verified as false positives**:

| Original Issue | Verification Result | Evidence |
|----------------|--------------------|-----------|
| Enum Status Mismatch | ✅ FALSE POSITIVE | `PayRunStatus` enum has `CALCULATING` case at line 8 |
| String Status in Query | ✅ FALSE POSITIVE | `updateTotals()` uses `PayRunItemStatus::CALCULATED` enum |
| Array Modification Side Effect | ✅ FALSE POSITIVE | Uses `array_merge()` to create new array, preserves original |

---

### HIGH PRIORITY ISSUES

#### 1. Formula Evaluation Placeholder
**Location:** `EmployeeEarning::evaluateFormula()` lines 101-104
**Problem:** Returns 0 without actual implementation.
```php
protected function evaluateFormula(array $context): float
{
    return 0;
}
```

**Impact:** Silent failure if formula type used for earnings calculation.

**Recommendation:** Implement formula evaluation or remove FORMULA from calculation types.

---

#### 2. No Transaction Wrapping in calculatePayRun()
**Location:** `PayRunService::calculatePayRun()` lines 108-144
**Problem:** Unlike `createPayRun()` and `completePayRun()` which use `DB::transaction()`, the `calculatePayRun()` method lacks transaction wrapping.

**Impact:** Partial calculation state possible if process interrupted.

**Recommendation:** Wrap in `DB::transaction()` for consistency and atomicity.

---

### MEDIUM PRIORITY ISSUES

| # | Issue | Location | Impact | Status |
|---|-------|----------|--------|--------|
| 3 | CRA Applied Twice Risk | TaxCalculationService + TaxRelief | LOW - Both methods have version guards | Monitor |
| 4 | Timesheet no validation | `Timesheet::getDurationMinutes()` | Negative hours possible | Open |
| 5 | Payslip cancel string | `Payslip::cancel()` | Inconsistent with enum pattern | Open |
| 6 | Annual cap not enforced | `EmployeeDeduction::calculateAmount()` | Yearly limits not applied | Open |
| 7 | Cascading deletes | Migrations | Could lose payslip data | Open |
| 8 | Browser confirm() | Multiple pages | Poor UX | Open |

### LOW PRIORITY / INFORMATIONAL

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 9 | Hardcoded Tax Values | `TaxCalculationService::calculateCRA()` | CRA abolished in NTA 2025, PITA values fixed |
| 10 | Pay Amount Ambiguity | `WageAdvanceService::calculateEligibility()` | Convention is monthly; documented |
| 11 | Semi-monthly edge case | `PayCalendar::getPeriodDates()` | Edge case, rarely encountered |

---

## Optimization Concerns

### Backend Performance

| Concern | Location | Severity | Recommendation |
|---------|----------|----------|----------------|
| N+1 queries | Pay run calculation loop | High | Eager load relationships |
| No calculation caching | Tax calculations | Medium | Cache tax tables |
| Large JSON storage | Payslip breakdowns | Low | Consider normalization |

### Frontend Performance

| Concern | Location | Severity | Recommendation |
|---------|----------|----------|----------------|
| Large lists not virtualized | Payroll Index | Medium | Add virtualization |
| No pagination UI | Some pages | Medium | Add pagination controls |
| No skeleton loaders | All pages | Low | Add loading states |
| No React.memo | List items | Low | Optimize re-renders |

---

## Recommendations

### Short-Term Improvements (Recommended)

1. **Add transaction wrapping to calculatePayRun()**
   - Wrap in DB::transaction for consistency
   - Other critical methods already use transactions

2. **Implement formula evaluation**
   - Complete `evaluateFormula()` method
   - Or remove FORMULA from calculation types if unused

3. **Add validation**
   - Timesheet clock_out > clock_in
   - Positive earnings amounts
   - Net pay not negative

4. **Replace browser confirm()**
   - Use custom modal component
   - Consistent UX pattern

### Medium-Term Enhancements

5. **Improve type safety**
   - Remove `any` types in frontend
   - Use numbers for amounts (not strings)
   - Add discriminated unions

6. **Performance optimization**
   - Eager load relationships in calculations
   - Cache tax tables per tenant
   - Add pagination throughout

### Long-Term Considerations

7. **Analytics dashboard**
    - Payroll trend charts
    - Cost forecasting
    - Department analysis

8. **Bulk operations**
    - Bulk approve timesheets
    - Batch payroll processing
    - Import capabilities

9. **Workflow customization**
    - Configurable approval chains
    - Custom status flows
    - Role-based field visibility

---

## Risk Assessment

### Production Readiness

| Category | Status | Risk Level |
|----------|--------|------------|
| Core Functionality | Working | LOW |
| Tax Calculations | Correct (PITA + NTA 2025) | LOW |
| Data Integrity | Good | LOW |
| Performance | Acceptable | LOW |
| Security | Good | LOW |
| UX/Accessibility | Good | LOW |

### Overall Verdict

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│    PRODUCTION READINESS: READY                                                  │
│                                                                                  │
│    The Payroll Processing Pipeline is architecturally sound with a well-        │
│    designed service layer and comprehensive tax calculation logic.              │
│                                                                                  │
│    Key Strengths:                                                               │
│    • PayRunStatus enum properly defines CALCULATING case                        │
│    • Status queries correctly use enum values                                   │
│    • DeductionsService uses array_merge() - no side effects                     │
│    • Tax calculation correctly implements Nigerian PAYE (PITA + NTA 2025)       │
│    • PayrollService properly deprecated with migration path                     │
│    • Date-aware tax law selection working correctly                             │
│                                                                                  │
│    Remaining Items (Non-blocking):                                              │
│    1. Add DB::transaction to calculatePayRun() for consistency                  │
│    2. Implement formula evaluation if FORMULA type is needed                    │
│                                                                                  │
│    System Health Score: 85/100                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Nigerian Tax Bands Reference

### PITA 2011 (Effective through Dec 31, 2025)

| Band | Income Range | Rate |
|------|--------------|------|
| 1 | First ₦300,000 | 7% |
| 2 | Next ₦300,000 | 11% |
| 3 | Next ₦500,000 | 15% |
| 4 | Next ₦500,000 | 19% |
| 5 | Next ₦1,600,000 | 21% |
| 6 | Above ₦3,200,000 | 24% |

**CRA (Consolidated Relief Allowance):**
```
CRA = max((Gross Annual × 1%) + ₦200,000, Gross Annual × 20%)
```

### NTA 2025 (Effective January 1, 2026)

| Band | Income Range | Rate |
|------|--------------|------|
| 1 | ₦0 - ₦800,000 | 0% (Exempt) |
| 2 | ₦800,001 - ₦3,000,000 | 15% |
| 3 | ₦3,000,001 - ₦12,000,000 | 18% |
| 4 | ₦12,000,001 - ₦25,000,000 | 21% |
| 5 | ₦25,000,001 - ₦50,000,000 | 23% |
| 6 | Above ₦50,000,000 | 25% |

**Key NTA 2025 Changes:**
- CRA abolished
- Low-income exemption: ≤₦800K annual income
- Rent Relief: min(₦500K, 20% × annual rent) with proof required

---

*Original Analysis: December 2024*
*Verification Update: January 15, 2026*
*Analyst: Claude Code*
*ShelfWise Platform Version: Beta*
