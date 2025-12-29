<?php

namespace App\Services;

use Illuminate\Support\Collection;

class PayrollExportService
{
    public function __construct(
        protected ExportService $exportService
    ) {}

    public function formatPayrollSummary(array $reportData): array
    {
        $headers = [
            'Employee',
            'Email',
            'Period',
            'Basic Salary',
            'Gross Pay',
            'PAYE Tax',
            'Pension (Employee)',
            'Pension (Employer)',
            'Total Deductions',
            'Net Pay',
        ];

        $rows = collect($reportData['breakdown'])->map(function ($item) {
            return [
                $item['employee_name'],
                $item['employee_email'],
                $item['period'],
                number_format($item['basic_salary'], 2),
                number_format($item['gross_pay'], 2),
                number_format($item['paye'], 2),
                number_format($item['pension_employee'], 2),
                number_format($item['pension_employer'], 2),
                number_format($item['total_deductions'], 2),
                number_format($item['net_pay'], 2),
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    public function formatTaxRemittance(array $reportData): array
    {
        $headers = [
            'Employee',
            'Tax ID',
            'Period',
            'Gross Income',
            'Taxable Income',
            'Tax Free Allowance',
            'PAYE Tax',
            'Effective Rate (%)',
        ];

        $rows = collect($reportData['breakdown'])->map(function ($item) {
            return [
                $item['employee_name'],
                $item['tax_id'],
                $item['period'],
                number_format($item['gross_income'], 2),
                number_format($item['taxable_income'], 2),
                number_format($item['tax_free_allowance'], 2),
                number_format($item['paye_tax'], 2),
                $item['effective_rate'] . '%',
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    public function formatPensionReport(array $reportData): array
    {
        $headers = [
            'Employee',
            'Period',
            'Gross Salary',
            'Employee Contribution',
            'Employer Contribution',
            'Total Contribution',
        ];

        $rows = collect($reportData['breakdown'])->map(function ($item) {
            return [
                $item['employee_name'],
                $item['period'],
                number_format($item['gross_salary'], 2),
                number_format($item['employee_contribution'], 2),
                number_format($item['employer_contribution'], 2),
                number_format($item['total_contribution'], 2),
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    public function formatBankSchedule(array $reportData): array
    {
        $headers = [
            'Employee',
            'Bank Name',
            'Account Number',
            'Net Pay',
            'Narration',
        ];

        $rows = collect($reportData['schedule'])->map(function ($item) {
            return [
                $item['employee_name'],
                $item['bank_name'],
                $item['account_number'],
                number_format($item['net_pay'], 2),
                $item['narration'],
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    public function formatPayrollJournal(array $reportData): array
    {
        $headers = [
            'Date',
            'Reference',
            'Description',
            'Account',
            'Debit',
            'Credit',
        ];

        $rows = collect($reportData['entries'])->map(function ($entry) {
            return [
                $entry['date'],
                $entry['reference'],
                $entry['description'],
                $entry['account'],
                $entry['debit'] > 0 ? number_format($entry['debit'], 2) : '',
                $entry['credit'] > 0 ? number_format($entry['credit'], 2) : '',
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    public function exportSummaryToCsv(array $reportData, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $formatted = $this->formatPayrollSummary($reportData);
        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportSummaryToExcel(array $reportData, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $formatted = $this->formatPayrollSummary($reportData);
        return $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportSummaryToPdf(array $reportData, string $filename, string $title): \Illuminate\Http\Response
    {
        $formatted = $this->formatPayrollSummary($reportData);
        return $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], $filename, $title);
    }

    public function exportTaxToCsv(array $reportData, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $formatted = $this->formatTaxRemittance($reportData);
        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportTaxToExcel(array $reportData, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $formatted = $this->formatTaxRemittance($reportData);
        return $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportTaxToPdf(array $reportData, string $filename, string $title): \Illuminate\Http\Response
    {
        $formatted = $this->formatTaxRemittance($reportData);
        return $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], $filename, $title);
    }

    public function exportPensionToCsv(array $reportData, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $formatted = $this->formatPensionReport($reportData);
        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportPensionToExcel(array $reportData, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $formatted = $this->formatPensionReport($reportData);
        return $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportPensionToPdf(array $reportData, string $filename, string $title): \Illuminate\Http\Response
    {
        $formatted = $this->formatPensionReport($reportData);
        return $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], $filename, $title);
    }

    public function exportBankScheduleToCsv(array $reportData, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $formatted = $this->formatBankSchedule($reportData);
        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportBankScheduleToExcel(array $reportData, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $formatted = $this->formatBankSchedule($reportData);
        return $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportBankScheduleToPdf(array $reportData, string $filename, string $title): \Illuminate\Http\Response
    {
        $formatted = $this->formatBankSchedule($reportData);
        return $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], $filename, $title);
    }

    public function exportJournalToCsv(array $reportData, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $formatted = $this->formatPayrollJournal($reportData);
        return $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportJournalToExcel(array $reportData, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $formatted = $this->formatPayrollJournal($reportData);
        return $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], $filename);
    }

    public function exportJournalToPdf(array $reportData, string $filename, string $title): \Illuminate\Http\Response
    {
        $formatted = $this->formatPayrollJournal($reportData);
        return $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], $filename, $title);
    }
}
