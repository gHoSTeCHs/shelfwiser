<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;

class ExportService
{
    /**
     * Export data to CSV format
     */
    public function exportToCsv(array $headers, Collection $data, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $callback = function () use ($headers, $data) {
            $file = fopen('php://output', 'w');

            // Write headers
            fputcsv($file, $headers);

            // Write data
            foreach ($data as $row) {
                fputcsv($file, is_array($row) ? $row : (array) $row);
            }

            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Export data to Excel format
     */
    public function exportToExcel(array $headers, Collection $data, string $filename): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        return Excel::download(
            new class($headers, $data) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings
            {
                public function __construct(private array $headers, private Collection $data) {}

                public function collection(): Collection
                {
                    return $this->data;
                }

                public function headings(): array
                {
                    return $this->headers;
                }
            },
            $filename
        );
    }

    /**
     * Export data to PDF format
     */
    public function exportToPdf(array $headers, Collection $data, string $filename, string $title = 'Report'): \Illuminate\Http\Response
    {
        $pdf = Pdf::loadView('exports.table', [
            'title' => $title,
            'headers' => $headers,
            'data' => $data,
        ]);

        return $pdf->download($filename);
    }

    /**
     * Format sales data for export
     */
    public function formatSalesExport(Collection $salesData, string $groupBy): array
    {
        $headers = match ($groupBy) {
            'product' => ['Product', 'SKU', 'Category', 'Orders', 'Quantity Sold', 'Revenue', 'Avg Price'],
            'customer' => ['Customer', 'Email', 'Total Orders', 'Total Revenue', 'Avg Order Value', 'Last Order Date'],
            'shop' => ['Shop', 'Orders', 'Revenue', 'Discounts', 'Avg Order Value'],
            'day' => ['Date', 'Orders', 'Revenue', 'Avg Order', 'Discounts'],
            default => ['Order #', 'Customer', 'Shop', 'Amount', 'Status', 'Payment Status', 'Date'],
        };

        $rows = $salesData->map(function ($item) use ($groupBy) {
            return match ($groupBy) {
                'product' => [
                    $item->productVariant?->product?->name ?? 'N/A',
                    $item->productVariant?->sku ?? 'N/A',
                    $item->productVariant?->product?->category?->name ?? 'N/A',
                    $item->order_count,
                    $item->total_quantity,
                    $item->total_revenue,
                    $item->avg_price,
                ],
                'customer' => [
                    ($item->customer?->first_name ?? '').' '.($item->customer?->last_name ?? ''),
                    $item->customer?->email ?? 'N/A',
                    $item->order_count,
                    $item->total_revenue,
                    $item->avg_order_value,
                    $item->last_order_date,
                ],
                'shop' => [
                    $item->shop?->name ?? 'N/A',
                    $item->order_count,
                    $item->total_revenue,
                    $item->total_discounts,
                    $item->avg_order_value,
                ],
                'day' => [
                    $item->sale_date,
                    $item->order_count,
                    $item->total_revenue,
                    $item->avg_order_value,
                    $item->total_discounts,
                ],
                default => [
                    $item->order_number,
                    $item->customer ? ($item->customer->first_name.' '.$item->customer->last_name) : 'Walk-in',
                    $item->shop?->name ?? 'N/A',
                    $item->total_amount,
                    $item->status,
                    $item->payment_status,
                    $item->created_at,
                ],
            };
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    /**
     * Format inventory data for export
     */
    public function formatInventoryExport(Collection $inventoryData): array
    {
        $headers = ['Product', 'SKU', 'Shop', 'Stock Level', 'Reorder Level', 'Cost Price', 'Total Value', 'Status'];

        $rows = $inventoryData->map(function ($item) {
            $totalStock = $item->inventoryLocations->sum('quantity');
            $isLow = $item->reorder_level && $totalStock <= $item->reorder_level;
            $status = $isLow ? 'Low Stock' : ($totalStock > ($item->reorder_level * 3) ? 'Overstocked' : 'Adequate');

            return [
                $item->product?->name ?? 'N/A',
                $item->sku,
                $item->product?->shop?->name ?? 'N/A',
                $totalStock,
                $item->reorder_level ?? 'N/A',
                $item->cost_price ?? 'N/A',
                $totalStock * ($item->cost_price ?? 0),
                $status,
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    /**
     * Format supplier data for export
     */
    public function formatSupplierExport(Collection $supplierData): array
    {
        $headers = ['PO Number', 'Supplier', 'Shop', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Payment Status', 'Date'];

        $rows = $supplierData->map(function ($item) {
            return [
                $item->po_number,
                $item->supplierTenant?->name ?? 'N/A',
                $item->shop?->name ?? 'N/A',
                $item->total_amount,
                $item->paid_amount,
                $item->total_amount - $item->paid_amount,
                $item->status,
                $item->payment_status,
                $item->created_at,
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    /**
     * Format financial data for export
     */
    public function formatFinancialExport(array $financialData, string $from, string $to): array
    {
        $headers = ['Report Section', 'Item', 'Amount'];

        $rows = collect([
            // P&L Section
            ['Profit & Loss', 'Gross Sales', $financialData['profit_loss']['gross_sales']],
            ['Profit & Loss', 'Discounts', -$financialData['profit_loss']['discounts']],
            ['Profit & Loss', 'Net Sales', $financialData['profit_loss']['net_sales']],
            ['Profit & Loss', 'COGS', -$financialData['profit_loss']['cogs']],
            ['Profit & Loss', 'Gross Profit', $financialData['profit_loss']['gross_profit']],
            ['Profit & Loss', 'Gross Margin %', $financialData['profit_loss']['gross_margin'].'%'],
            ['Profit & Loss', 'Operating Expenses', -$financialData['profit_loss']['operating_expenses']],
            ['Profit & Loss', 'Net Profit', $financialData['profit_loss']['net_profit']],
            ['Profit & Loss', 'Net Margin %', $financialData['profit_loss']['net_margin'].'%'],

            // Cash Flow Section
            ['Cash Flow', 'Cash Inflow', $financialData['cash_flow']['cash_inflow']],
            ['Cash Flow', 'Cash Outflow', -$financialData['cash_flow']['cash_outflow']],
            ['Cash Flow', 'Net Cash Flow', $financialData['cash_flow']['net_cash_flow']],

            // Balance Sheet Section
            ['Balance Sheet', 'Inventory', $financialData['balance_sheet']['assets']['inventory']],
            ['Balance Sheet', 'Accounts Receivable', $financialData['balance_sheet']['assets']['accounts_receivable']],
            ['Balance Sheet', 'Total Current Assets', $financialData['balance_sheet']['assets']['total_current_assets']],
            ['Balance Sheet', 'Accounts Payable', $financialData['balance_sheet']['liabilities']['accounts_payable']],
            ['Balance Sheet', 'Total Current Liabilities', $financialData['balance_sheet']['liabilities']['total_current_liabilities']],
            ['Balance Sheet', 'Working Capital', $financialData['balance_sheet']['working_capital']],
        ]);

        return ['headers' => $headers, 'rows' => $rows];
    }

    /**
     * Format customer analytics data for export
     */
    public function formatCustomerAnalyticsExport(Collection $customerData): array
    {
        $headers = [
            'Customer',
            'Email',
            'Total Orders',
            'Total Revenue',
            'Avg Order Value',
            'Lifetime Value',
            'First Order',
            'Last Order',
            'Days Since Last Order',
            'Status',
        ];

        $rows = $customerData->map(function ($item) {
            return [
                ($item->customer?->first_name ?? '').' '.($item->customer?->last_name ?? ''),
                $item->customer?->email ?? 'N/A',
                $item->order_count,
                $item->total_revenue,
                $item->avg_order_value,
                $item->lifetime_value ?? $item->total_revenue,
                $item->first_order_date ?? 'N/A',
                $item->last_order_date ?? 'N/A',
                $item->days_since_last_order ?? 'N/A',
                $item->customer_status ?? 'Active',
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }

    /**
     * Format product profitability data for export
     */
    public function formatProductProfitabilityExport(Collection $productData): array
    {
        $headers = [
            'Product',
            'SKU',
            'Category',
            'Units Sold',
            'Revenue',
            'COGS',
            'Gross Profit',
            'Profit Margin %',
            'Avg Selling Price',
            'Cost Price',
        ];

        $rows = $productData->map(function ($item) {
            return [
                $item->productVariant?->product?->name ?? 'N/A',
                $item->productVariant?->sku ?? 'N/A',
                $item->productVariant?->product?->category?->name ?? 'N/A',
                $item->total_quantity,
                $item->total_revenue,
                $item->total_cogs,
                $item->gross_profit,
                $item->profit_margin,
                $item->avg_selling_price,
                $item->cost_price ?? 'N/A',
            ];
        });

        return ['headers' => $headers, 'rows' => $rows];
    }
}
