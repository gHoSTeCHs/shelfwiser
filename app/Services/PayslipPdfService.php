<?php

namespace App\Services;

use App\Models\Payslip;
use App\Models\PayRun;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayslipPdfService
{
    public function generatePayslipPdf(Payslip $payslip): \Barryvdh\DomPDF\PDF
    {
        $payslip->load([
            'user:id,name,email',
            'user.employeePayrollDetail:id,user_id,position_title,department,bank_name,bank_account_number,tax_id_number',
            'payrollPeriod:id,period_name,start_date,end_date',
            'tenant:id,name',
            'shop:id,name,address,city,state,phone,email',
        ]);

        $data = $this->preparePayslipData($payslip);

        return Pdf::loadView('pdf.payslips.payslip', $data)
            ->setPaper('a4', 'portrait');
    }

    public function downloadPayslip(Payslip $payslip): Response
    {
        $pdf = $this->generatePayslipPdf($payslip);
        $filename = $this->generateFilename($payslip);

        return $pdf->download($filename);
    }

    public function streamPayslip(Payslip $payslip): Response
    {
        $pdf = $this->generatePayslipPdf($payslip);
        return $pdf->stream($this->generateFilename($payslip));
    }

    public function generateBulkPayslipsPdf(Collection $payslips): \Barryvdh\DomPDF\PDF
    {
        $payslipsData = [];

        foreach ($payslips as $payslip) {
            $payslip->load([
                'user:id,name,email',
                'user.employeePayrollDetail:id,user_id,position_title,department,bank_name,bank_account_number,tax_id_number',
                'payrollPeriod:id,period_name,start_date,end_date',
                'tenant:id,name',
                'shop:id,name,address,city,state,phone,email',
            ]);

            $payslipsData[] = $this->preparePayslipData($payslip);
        }

        return Pdf::loadView('pdf.payslips.bulk', ['payslips' => $payslipsData])
            ->setPaper('a4', 'portrait');
    }

    public function downloadBulkPayslips(PayRun $payRun): Response
    {
        $payslips = $payRun->payslips()
            ->where('status', '!=', 'cancelled')
            ->get();

        $pdf = $this->generateBulkPayslipsPdf($payslips);
        $filename = sprintf('Payslips_%s_%s.pdf', $payRun->reference, now()->format('Ymd'));

        return $pdf->download($filename);
    }

    protected function preparePayslipData(Payslip $payslip): array
    {
        $earningsBreakdown = $payslip->earnings_breakdown ?? [];
        $deductionsBreakdown = $payslip->deductions_breakdown ?? [];
        $taxCalculation = $payslip->tax_calculation ?? [];
        $employerContributions = $payslip->employer_contributions ?? [];

        return [
            'payslip' => $payslip,
            'employee' => $payslip->user,
            'payrollDetail' => $payslip->user?->employeePayrollDetail,
            'period' => $payslip->payrollPeriod,
            'tenant' => $payslip->tenant,
            'shop' => $payslip->shop,
            'earnings' => $this->categorizeEarnings($earningsBreakdown),
            'deductions' => $this->categorizeDeductions($deductionsBreakdown),
            'tax' => $taxCalculation,
            'employer' => $employerContributions,
            'totals' => [
                'gross_earnings' => (float) $payslip->gross_pay,
                'total_deductions' => (float) $payslip->total_deductions,
                'net_pay' => (float) $payslip->net_pay,
            ],
            'generated_at' => now(),
        ];
    }

    protected function categorizeEarnings(array $breakdown): array
    {
        $basic = [];
        $allowances = [];
        $bonuses = [];
        $other = [];

        foreach ($breakdown as $item) {
            $category = $item['category'] ?? 'other';

            switch ($category) {
                case 'base':
                case 'basic':
                    $basic[] = $item;
                    break;
                case 'allowance':
                    $allowances[] = $item;
                    break;
                case 'bonus':
                case 'commission':
                    $bonuses[] = $item;
                    break;
                default:
                    $other[] = $item;
            }
        }

        return [
            'basic' => $basic,
            'allowances' => $allowances,
            'bonuses' => $bonuses,
            'other' => $other,
            'total' => array_sum(array_column($breakdown, 'amount')),
        ];
    }

    protected function categorizeDeductions(array $breakdown): array
    {
        $statutory = [];
        $voluntary = [];
        $loans = [];
        $other = [];

        foreach ($breakdown as $item) {
            $category = $item['category'] ?? 'other';

            switch ($category) {
                case 'statutory':
                case 'tax':
                    $statutory[] = $item;
                    break;
                case 'voluntary':
                    $voluntary[] = $item;
                    break;
                case 'loan':
                case 'advance':
                    $loans[] = $item;
                    break;
                default:
                    $other[] = $item;
            }
        }

        return [
            'statutory' => $statutory,
            'voluntary' => $voluntary,
            'loans' => $loans,
            'other' => $other,
            'total' => array_sum(array_column($breakdown, 'amount')),
        ];
    }

    protected function generateFilename(Payslip $payslip): string
    {
        $employeeName = str_replace(' ', '_', $payslip->user?->name ?? 'Employee');
        $period = $payslip->payrollPeriod?->period_name ?? 'Period';

        return sprintf(
            'Payslip_%s_%s_%s.pdf',
            $employeeName,
            $period,
            now()->format('Ymd')
        );
    }
}
