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
     * @param ProductVariant $variant
     * @return string The generated EAN-13 barcode
     */
    public function generateEAN13(ProductVariant $variant): string
    {
        $tenantId = $variant->product->tenant_id;

        // Get tenant prefix (4 digits)
        $tenantPrefix = str_pad($tenantId % 10000, 4, '0', STR_PAD_LEFT);

        // Generate unique sequence number for this tenant
        $sequence = $this->getNextSequence($tenantId);
        $sequenceStr = str_pad($sequence % 10000000, 7, '0', STR_PAD_LEFT);

        // Build barcode without check digit (12 digits)
        $barcodeBase = '2' . $tenantPrefix . $sequenceStr;

        // Calculate and append check digit
        $checkDigit = $this->calculateEAN13CheckDigit($barcodeBase);

        return $barcodeBase . $checkDigit;
    }

    /**
     * Generate a barcode and assign it to a variant.
     *
     * @param ProductVariant $variant
     * @return string The generated barcode
     */
    public function generateAndAssign(ProductVariant $variant): string
    {
        // Don't overwrite existing barcodes
        if (!empty($variant->barcode)) {
            return $variant->barcode;
        }

        $barcode = $this->generateEAN13($variant);

        // Ensure uniqueness
        $attempts = 0;
        while (ProductVariant::where('barcode', $barcode)->exists() && $attempts < 10) {
            // If collision, generate new one
            $barcode = $this->generateEAN13($variant);
            $attempts++;
        }

        if ($attempts >= 10) {
            throw new \RuntimeException('Failed to generate unique barcode after 10 attempts');
        }

        $variant->update(['barcode' => $barcode]);

        return $barcode;
    }

    /**
     * Batch generate barcodes for multiple variants.
     *
     * @param array $variantIds
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
                        $results[$variantId] = $this->generateAndAssign($variant);
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
     *
     * @param string $barcode
     * @return bool
     */
    public function validateEAN13(string $barcode): bool
    {
        // Must be exactly 13 digits
        if (!preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        // Verify check digit
        $base = substr($barcode, 0, 12);
        $expectedCheckDigit = $this->calculateEAN13CheckDigit($base);

        return $barcode[12] === $expectedCheckDigit;
    }

    /**
     * Calculate the check digit for an EAN-13 barcode.
     *
     * @param string $base First 12 digits of the barcode
     * @return string The check digit (0-9)
     */
    private function calculateEAN13CheckDigit(string $base): string
    {
        $sum = 0;

        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $base[$i];
            // Odd positions (1,3,5...) multiply by 1, even (2,4,6...) multiply by 3
            $sum += $digit * (($i % 2 === 0) ? 1 : 3);
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return (string) $checkDigit;
    }

    /**
     * Get the next sequence number for barcode generation.
     *
     * @param int $tenantId
     * @return int
     */
    private function getNextSequence(int $tenantId): int
    {
        // Get the highest existing sequence for this tenant's barcodes
        $lastBarcode = ProductVariant::whereHas('product', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })
            ->whereNotNull('barcode')
            ->where('barcode', 'like', '2' . str_pad($tenantId % 10000, 4, '0', STR_PAD_LEFT) . '%')
            ->orderByDesc('barcode')
            ->value('barcode');

        if ($lastBarcode) {
            // Extract sequence from existing barcode (positions 5-11)
            $lastSequence = (int) substr($lastBarcode, 5, 7);
            return $lastSequence + 1;
        }

        // Start from 1 if no existing barcodes
        return 1;
    }

    /**
     * Generate a simpler Code-128 barcode (alphanumeric).
     * Useful for SKU-based barcodes.
     *
     * @param ProductVariant $variant
     * @return string
     */
    public function generateCode128(ProductVariant $variant): string
    {
        // Use SKU if available, otherwise generate
        if (!empty($variant->sku)) {
            return $variant->sku;
        }

        $tenantId = $variant->product->tenant_id;
        $sequence = $this->getNextSequence($tenantId);

        return sprintf('SW-%04d-%07d', $tenantId % 10000, $sequence);
    }
}
