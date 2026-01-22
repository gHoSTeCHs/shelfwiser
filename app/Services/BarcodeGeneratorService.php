<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class BarcodeGeneratorService
{
    /**
     * Generate an EAN-13 barcode for a product variant.
     *
     * Format: 2TTTTPPPPPPPC
     * - 2: In-store prefix (GS1 standard for internal use)
     * - TTTT: Tenant ID (4 digits, zero-padded)
     * - PPPPPPP: Product/Variant sequence (7 digits)
     * - C: Check digit (calculated)
     *
     * @return string The generated EAN-13 barcode
     */
    public function generateEAN13(ProductVariant $variant): string
    {
        $tenantId = $variant->product->tenant_id;

        $tenantPrefix = str_pad($tenantId % 10000, 4, '0', STR_PAD_LEFT);

        $sequence = $this->getNextSequence($tenantId);
        $sequenceStr = str_pad($sequence % 10000000, 7, '0', STR_PAD_LEFT);

        $barcodeBase = '2'.$tenantPrefix.$sequenceStr;

        $checkDigit = $this->calculateEAN13CheckDigit($barcodeBase);

        return $barcodeBase.$checkDigit;
    }

    /**
     * Generate a barcode and assign it to a variant.
     * Uses database transaction with pessimistic locking to prevent race conditions.
     *
     * @return string The generated barcode
     */
    public function generateAndAssign(ProductVariant $variant): string
    {
        if (! empty($variant->barcode)) {
            return $variant->barcode;
        }

        return DB::transaction(function () use ($variant) {
            $barcode = $this->generateEAN13WithLock($variant);

            $variant->update(['barcode' => $barcode]);

            return $barcode;
        });
    }

    /**
     * Batch generate barcodes for multiple variants.
     *
     * @return array Results with variant_id => barcode mapping
     */
    public function batchGenerate(array $variantIds): array
    {
        $results = [];

        DB::transaction(function () use ($variantIds, &$results) {
            foreach ($variantIds as $variantId) {
                $variant = ProductVariant::with('product')->find($variantId);

                if ($variant && empty($variant->barcode)) {
                    try {
                        $results[$variantId] = $this->generateAndAssignWithinTransaction($variant);
                    } catch (\Exception $e) {
                        $results[$variantId] = null;
                    }
                }
            }
        });

        return $results;
    }

    /**
     * Validate an EAN-13 barcode.
     */
    public function validateEAN13(string $barcode): bool
    {
        if (! preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        $base = substr($barcode, 0, 12);
        $expectedCheckDigit = $this->calculateEAN13CheckDigit($base);

        return $barcode[12] === $expectedCheckDigit;
    }

    /**
     * Calculate the check digit for an EAN-13 barcode.
     *
     * @param  string  $base  First 12 digits of the barcode
     * @return string The check digit (0-9)
     */
    private function calculateEAN13CheckDigit(string $base): string
    {
        $sum = 0;

        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $base[$i];
            $sum += $digit * (($i % 2 === 0) ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return (string) $checkDigit;
    }

    /**
     * Get the next sequence number for barcode generation with pessimistic locking.
     * This method uses lockForUpdate to prevent race conditions when generating barcodes.
     */
    private function getNextSequence(int $tenantId): int
    {
        $tenantPrefix = str_pad($tenantId % 10000, 4, '0', STR_PAD_LEFT);
        $barcodePattern = '2'.$tenantPrefix.'%';

        $lastBarcode = ProductVariant::whereHas('product', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })
            ->whereNotNull('barcode')
            ->where('barcode', 'like', $barcodePattern)
            ->lockForUpdate()
            ->orderByDesc('barcode')
            ->value('barcode');

        if ($lastBarcode) {
            $lastSequence = (int) substr($lastBarcode, 5, 7);

            return $lastSequence + 1;
        }

        return 1;
    }

    /**
     * Generate an EAN-13 barcode with pessimistic locking to prevent race conditions.
     * This method must be called within a database transaction.
     *
     * @return string The generated barcode
     */
    private function generateEAN13WithLock(ProductVariant $variant): string
    {
        $tenantId = $variant->product->tenant_id;

        $tenantPrefix = str_pad($tenantId % 10000, 4, '0', STR_PAD_LEFT);

        $sequence = $this->getNextSequence($tenantId);
        $sequenceStr = str_pad($sequence % 10000000, 7, '0', STR_PAD_LEFT);

        $barcodeBase = '2'.$tenantPrefix.$sequenceStr;

        $checkDigit = $this->calculateEAN13CheckDigit($barcodeBase);

        $barcode = $barcodeBase.$checkDigit;

        $attempts = 0;
        while (ProductVariant::where('barcode', $barcode)->exists() && $attempts < 10) {
            $sequence++;
            $sequenceStr = str_pad($sequence % 10000000, 7, '0', STR_PAD_LEFT);
            $barcodeBase = '2'.$tenantPrefix.$sequenceStr;
            $checkDigit = $this->calculateEAN13CheckDigit($barcodeBase);
            $barcode = $barcodeBase.$checkDigit;
            $attempts++;
        }

        if ($attempts >= 10) {
            throw new \RuntimeException('Failed to generate unique barcode after 10 attempts');
        }

        return $barcode;
    }

    /**
     * Generate and assign barcode within an existing transaction.
     * This is used by batchGenerate to avoid nested transactions.
     *
     * @return string The generated barcode
     */
    private function generateAndAssignWithinTransaction(ProductVariant $variant): string
    {
        if (! empty($variant->barcode)) {
            return $variant->barcode;
        }

        $barcode = $this->generateEAN13WithLock($variant);

        $variant->update(['barcode' => $barcode]);

        return $barcode;
    }

    /**
     * Generate a simpler Code-128 barcode (alphanumeric).
     * Useful for SKU-based barcodes.
     */
    public function generateCode128(ProductVariant $variant): string
    {
        if (! empty($variant->sku)) {
            return $variant->sku;
        }

        $tenantId = $variant->product->tenant_id;
        $sequence = $this->getNextSequence($tenantId);

        return sprintf('SW-%04d-%07d', $tenantId % 10000, $sequence);
    }
}
