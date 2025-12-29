<?php

namespace App\Services;

use App\Models\PayRun;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NibssExportService
{
    protected array $bankCodes = [
        'access bank' => '044',
        'access' => '044',
        'citibank' => '023',
        'diamond bank' => '063',
        'ecobank' => '050',
        'fidelity bank' => '070',
        'fidelity' => '070',
        'first bank' => '011',
        'first bank of nigeria' => '011',
        'fcmb' => '214',
        'first city monument bank' => '214',
        'gtbank' => '058',
        'gtb' => '058',
        'guaranty trust bank' => '058',
        'heritage bank' => '030',
        'keystone bank' => '082',
        'polaris bank' => '076',
        'skye bank' => '076',
        'providus bank' => '101',
        'stanbic ibtc' => '221',
        'stanbic' => '221',
        'standard chartered' => '068',
        'sterling bank' => '232',
        'sterling' => '232',
        'suntrust bank' => '100',
        'union bank' => '032',
        'uba' => '033',
        'united bank for africa' => '033',
        'unity bank' => '215',
        'wema bank' => '035',
        'wema' => '035',
        'zenith bank' => '057',
        'zenith' => '057',
        'jaiz bank' => '301',
        'jaiz' => '301',
        'taj bank' => '302',
        'globus bank' => '103',
        'parallex bank' => '104',
        'kuda' => '50211',
        'kuda bank' => '50211',
        'opay' => '100004',
        'palmpay' => '100033',
        'moniepoint' => '50515',
    ];

    public function generateNibssFile(PayRun $payRun): string
    {
        $payRun->load([
            'items' => function ($q) {
                $q->where('status', 'calculated');
            },
            'items.user:id,name',
            'items.user.employeePayrollDetail:id,user_id,bank_name,bank_account_number',
            'tenant:id,name',
        ]);

        $lines = [];

        $lines[] = $this->generateHeader($payRun);

        $sequenceNumber = 1;
        foreach ($payRun->items as $item) {
            if ($item->net_pay <= 0) {
                continue;
            }

            $bankDetails = $item->user?->employeePayrollDetail;
            if (!$bankDetails?->bank_account_number || !$bankDetails?->bank_name) {
                continue;
            }

            $lines[] = $this->generateDetailRecord(
                $item,
                $bankDetails,
                $payRun,
                $sequenceNumber++
            );
        }

        $lines[] = $this->generateTrailer($payRun, $sequenceNumber - 1);

        return implode("\r\n", $lines);
    }

    public function downloadNibssFile(PayRun $payRun): StreamedResponse
    {
        $content = $this->generateNibssFile($payRun);
        $filename = sprintf(
            'NIBSS_SALARY_%s_%s.txt',
            $payRun->reference,
            now()->format('Ymd')
        );

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    protected function generateHeader(PayRun $payRun): string
    {
        $parts = [
            'H',
            str_pad(now()->format('Ymd'), 8),
            str_pad($payRun->tenant?->name ?? 'COMPANY', 30),
            str_pad($payRun->reference, 16),
            str_pad('SALARY', 10),
        ];

        return implode('', $parts);
    }

    protected function generateDetailRecord(
        $item,
        $bankDetails,
        PayRun $payRun,
        int $sequenceNumber
    ): string {
        $bankCode = $this->getBankCode($bankDetails->bank_name);
        $accountNumber = preg_replace('/[^0-9]/', '', $bankDetails->bank_account_number);
        $amount = (int) ($item->net_pay * 100);
        $beneficiaryName = strtoupper($item->user?->name ?? 'EMPLOYEE');
        $narration = sprintf('Salary %s', $payRun->payrollPeriod?->period_name ?? '');

        $parts = [
            'D',
            str_pad($sequenceNumber, 6, '0', STR_PAD_LEFT),
            str_pad($bankCode, 3, '0', STR_PAD_LEFT),
            str_pad($accountNumber, 10, '0', STR_PAD_LEFT),
            str_pad($amount, 15, '0', STR_PAD_LEFT),
            str_pad(Str::substr($beneficiaryName, 0, 30), 30),
            str_pad(Str::substr($narration, 0, 30), 30),
        ];

        return implode('', $parts);
    }

    protected function generateTrailer(PayRun $payRun, int $recordCount): string
    {
        $totalAmount = (int) ($payRun->total_net * 100);

        $parts = [
            'T',
            str_pad($recordCount, 6, '0', STR_PAD_LEFT),
            str_pad($totalAmount, 18, '0', STR_PAD_LEFT),
        ];

        return implode('', $parts);
    }

    public function getBankCode(string $bankName): string
    {
        $normalized = strtolower(trim($bankName));

        if (isset($this->bankCodes[$normalized])) {
            return $this->bankCodes[$normalized];
        }

        foreach ($this->bankCodes as $key => $code) {
            if (Str::contains($normalized, $key) || Str::contains($key, $normalized)) {
                return $code;
            }
        }

        return '000';
    }

    public function validateBankDetails(PayRun $payRun): array
    {
        $payRun->load([
            'items' => function ($q) {
                $q->where('status', 'calculated');
            },
            'items.user:id,name',
            'items.user.employeePayrollDetail:id,user_id,bank_name,bank_account_number',
        ]);

        $valid = [];
        $invalid = [];

        foreach ($payRun->items as $item) {
            if ($item->net_pay <= 0) {
                continue;
            }

            $bankDetails = $item->user?->employeePayrollDetail;

            $errors = [];

            if (!$bankDetails?->bank_account_number) {
                $errors[] = 'Missing account number';
            } elseif (!preg_match('/^\d{10}$/', preg_replace('/[^0-9]/', '', $bankDetails->bank_account_number))) {
                $errors[] = 'Invalid account number format (must be 10 digits)';
            }

            if (!$bankDetails?->bank_name) {
                $errors[] = 'Missing bank name';
            } elseif ($this->getBankCode($bankDetails->bank_name) === '000') {
                $errors[] = 'Unrecognized bank: ' . $bankDetails->bank_name;
            }

            if (empty($errors)) {
                $valid[] = [
                    'employee_id' => $item->user_id,
                    'employee_name' => $item->user?->name,
                    'bank_name' => $bankDetails->bank_name,
                    'bank_code' => $this->getBankCode($bankDetails->bank_name),
                    'account_number' => $bankDetails->bank_account_number,
                    'amount' => $item->net_pay,
                ];
            } else {
                $invalid[] = [
                    'employee_id' => $item->user_id,
                    'employee_name' => $item->user?->name,
                    'errors' => $errors,
                    'amount' => $item->net_pay,
                ];
            }
        }

        return [
            'valid_count' => count($valid),
            'invalid_count' => count($invalid),
            'valid' => $valid,
            'invalid' => $invalid,
            'total_valid_amount' => collect($valid)->sum('amount'),
            'can_generate' => count($invalid) === 0,
        ];
    }

    public function getSupportedBanks(): array
    {
        return collect($this->bankCodes)
            ->unique()
            ->map(function ($code, $name) {
                return [
                    'name' => ucwords($name),
                    'code' => $code,
                ];
            })
            ->unique('code')
            ->sortBy('name')
            ->values()
            ->all();
    }
}
