<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $employee?->name ?? 'Employee' }} - {{ $period?->period_name ?? 'Period' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #333; line-height: 1.4; }
        .container { padding: 20px; }

        .header { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #333; }
        .header-row { display: table; width: 100%; }
        .header-left, .header-right { display: table-cell; vertical-align: top; }
        .header-left { width: 60%; }
        .header-right { width: 40%; text-align: right; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .company-details { font-size: 9px; color: #666; }
        .payslip-title { font-size: 16px; font-weight: bold; color: #333; margin-top: 10px; }
        .payslip-period { font-size: 11px; color: #555; }

        .info-section { margin-bottom: 20px; }
        .info-grid { display: table; width: 100%; }
        .info-column { display: table-cell; width: 50%; vertical-align: top; padding-right: 20px; }
        .info-row { margin-bottom: 5px; }
        .info-label { font-weight: bold; color: #555; display: inline-block; width: 120px; }
        .info-value { display: inline-block; }

        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 8px 10px; margin-bottom: 10px; border-left: 3px solid #333; }

        .earnings-deductions { display: table; width: 100%; }
        .earnings-column, .deductions-column { display: table-cell; width: 50%; vertical-align: top; }
        .earnings-column { padding-right: 10px; }
        .deductions-column { padding-left: 10px; border-left: 1px solid #ddd; }

        .breakdown-table { width: 100%; border-collapse: collapse; }
        .breakdown-table th { text-align: left; padding: 5px; font-size: 9px; color: #666; border-bottom: 1px solid #ddd; }
        .breakdown-table td { padding: 5px; font-size: 10px; }
        .breakdown-table .amount { text-align: right; }
        .breakdown-table .category-header { font-weight: bold; font-size: 9px; color: #333; padding-top: 10px; }
        .breakdown-table .subtotal { font-weight: bold; border-top: 1px solid #ddd; }

        .summary-section { margin-top: 25px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
        .summary-table { width: 300px; margin-left: auto; }
        .summary-table td { padding: 5px 10px; }
        .summary-table .label { text-align: right; width: 60%; }
        .summary-table .amount { text-align: right; font-weight: bold; }
        .summary-table .net-pay { font-size: 14px; background: #333; color: #fff; }
        .summary-table .net-pay td { padding: 10px; }

        .employer-section { margin-top: 20px; padding: 10px; background: #f5f5f5; border: 1px dashed #ccc; }
        .employer-section .section-title { background: none; border-left: none; padding: 0; margin-bottom: 5px; font-size: 10px; color: #666; }
        .employer-grid { display: table; width: 100%; }
        .employer-item { display: table-cell; width: 33%; text-align: center; }
        .employer-item .label { font-size: 9px; color: #666; }
        .employer-item .value { font-size: 11px; font-weight: bold; }

        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; }
        .footer p { font-size: 9px; color: #666; margin-bottom: 3px; }
        .confidential { font-size: 8px; color: #999; margin-top: 10px; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-row">
                <div class="header-left">
                    <div class="company-name">{{ $tenant?->name ?? 'Company' }}</div>
                    <div class="company-details">
                        @if($shop)
                            @if($shop->address) {{ $shop->address }}<br> @endif
                            @if($shop->city) {{ $shop->city }}, @endif
                            @if($shop->state) {{ $shop->state }} @endif
                            <br>
                            @if($shop->phone) Tel: {{ $shop->phone }} @endif
                            @if($shop->email) | {{ $shop->email }} @endif
                        @endif
                    </div>
                </div>
                <div class="header-right">
                    <div class="payslip-title">PAYSLIP</div>
                    <div class="payslip-period">
                        {{ $period?->period_name ?? 'Pay Period' }}<br>
                        {{ $period?->start_date?->format('M d') ?? '' }} - {{ $period?->end_date?->format('M d, Y') ?? '' }}
                    </div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="info-grid">
                <div class="info-column">
                    <div class="info-row">
                        <span class="info-label">Employee Name:</span>
                        <span class="info-value">{{ $employee?->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{{ $employee?->email ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Position:</span>
                        <span class="info-value">{{ $payrollDetail?->position_title ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Department:</span>
                        <span class="info-value">{{ $payrollDetail?->department ?? 'N/A' }}</span>
                    </div>
                </div>
                <div class="info-column">
                    <div class="info-row">
                        <span class="info-label">Tax ID:</span>
                        <span class="info-value">{{ $payrollDetail?->tax_id_number ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Bank:</span>
                        <span class="info-value">{{ $payrollDetail?->bank_name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Account:</span>
                        <span class="info-value">
                            @if($payrollDetail?->bank_account_number)
                                ****{{ substr($payrollDetail->bank_account_number, -4) }}
                            @else
                                N/A
                            @endif
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payslip ID:</span>
                        <span class="info-value">#{{ str_pad($payslip->id, 6, '0', STR_PAD_LEFT) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="earnings-deductions">
            <div class="earnings-column">
                <div class="section-title">Earnings</div>
                <table class="breakdown-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="amount">Amount (₦)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @if(count($earnings['basic']) > 0)
                            <tr><td colspan="2" class="category-header">Basic Salary</td></tr>
                            @foreach($earnings['basic'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Basic' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($earnings['allowances']) > 0)
                            <tr><td colspan="2" class="category-header">Allowances</td></tr>
                            @foreach($earnings['allowances'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Allowance' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($earnings['bonuses']) > 0)
                            <tr><td colspan="2" class="category-header">Bonuses & Commission</td></tr>
                            @foreach($earnings['bonuses'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Bonus' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($earnings['other']) > 0)
                            <tr><td colspan="2" class="category-header">Other Earnings</td></tr>
                            @foreach($earnings['other'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Other' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        <tr class="subtotal">
                            <td><strong>Total Earnings</strong></td>
                            <td class="amount"><strong>{{ number_format($totals['gross_earnings'], 2) }}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="deductions-column">
                <div class="section-title">Deductions</div>
                <table class="breakdown-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="amount">Amount (₦)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @if(count($deductions['statutory']) > 0)
                            <tr><td colspan="2" class="category-header">Statutory Deductions</td></tr>
                            @foreach($deductions['statutory'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Statutory' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($deductions['voluntary']) > 0)
                            <tr><td colspan="2" class="category-header">Voluntary Deductions</td></tr>
                            @foreach($deductions['voluntary'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Voluntary' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($deductions['loans']) > 0)
                            <tr><td colspan="2" class="category-header">Loans & Advances</td></tr>
                            @foreach($deductions['loans'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Loan' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        @if(count($deductions['other']) > 0)
                            <tr><td colspan="2" class="category-header">Other Deductions</td></tr>
                            @foreach($deductions['other'] as $item)
                            <tr>
                                <td>{{ $item['type'] ?? $item['name'] ?? 'Other' }}</td>
                                <td class="amount">{{ number_format($item['amount'], 2) }}</td>
                            </tr>
                            @endforeach
                        @endif

                        <tr class="subtotal">
                            <td><strong>Total Deductions</strong></td>
                            <td class="amount"><strong>{{ number_format($totals['total_deductions'], 2) }}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td class="label">Gross Earnings:</td>
                    <td class="amount">₦{{ number_format($totals['gross_earnings'], 2) }}</td>
                </tr>
                <tr>
                    <td class="label">Total Deductions:</td>
                    <td class="amount">₦{{ number_format($totals['total_deductions'], 2) }}</td>
                </tr>
                <tr class="net-pay">
                    <td class="label">NET PAY:</td>
                    <td class="amount">₦{{ number_format($totals['net_pay'], 2) }}</td>
                </tr>
            </table>
        </div>

        @if($employer && (($employer['pension'] ?? 0) > 0 || ($employer['nhf'] ?? 0) > 0))
        <div class="employer-section">
            <div class="section-title">Employer Contributions (For Information Only)</div>
            <div class="employer-grid">
                @if(($employer['pension'] ?? 0) > 0)
                <div class="employer-item">
                    <div class="label">Pension (Employer)</div>
                    <div class="value">₦{{ number_format($employer['pension'], 2) }}</div>
                </div>
                @endif
                @if(($employer['nhf'] ?? 0) > 0)
                <div class="employer-item">
                    <div class="label">NHF (Employer)</div>
                    <div class="value">₦{{ number_format($employer['nhf'], 2) }}</div>
                </div>
                @endif
                <div class="employer-item">
                    <div class="label">Total Employer Cost</div>
                    <div class="value">₦{{ number_format(($employer['total'] ?? 0) + $totals['gross_earnings'], 2) }}</div>
                </div>
            </div>
        </div>
        @endif

        <div class="footer">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p>Generated on {{ $generated_at->format('F d, Y \a\t h:i A') }}</p>
            <p class="confidential">CONFIDENTIAL - For the named employee only. If received in error, please destroy immediately.</p>
        </div>
    </div>
</body>
</html>
