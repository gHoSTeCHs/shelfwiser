<?php

namespace App\Services;

use App\Models\ProductVariant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class BarcodeGeneratorService
{
    private const MAX_RETRY_ATTEMPTS = 5;

    private const INTERNAL_PREFIX = '2';

    private const TENANT_DIGITS = 4;

    private const SEQUENCE_DIGITS = 7;

    /**
     * Generate a barcode and assign it to a variant.
     * Uses unique constraint as the authoritative duplicate check with retry on collision.
     *
     * EAN-13 Format: 2TTTTPPPPPPPC
     * - 2: In-store prefix (GS1 standard for internal use)
     * - TTTT: Tenant ID (4 digits, zero-padded, mod 10000)
     * - PPPPPPP: Sequence number (7 digits)
     * - C: EAN-13 check digit
     *
     * @throws RuntimeException|Throwable If barcode generation fails after max retries
     */
    public function generateAndAssign(ProductVariant $variant): string
    {
        if ($variant->barcode) {
            return $variant->barcode;
        }

        $tenantId = $variant->product->tenant_id;

        for ($attempt = 0; $attempt < self::MAX_RETRY_ATTEMPTS; $attempt++) {
            $barcode = DB::transaction(function () use ($tenantId, $attempt) {
                $sequence = $this->getNextSequence($tenantId) + $attempt;

                return $this->buildEAN13($tenantId, $sequence);
            });

            try {
                $variant->update(['barcode' => $barcode]);

                return $barcode;
            } catch (QueryException $e) {
                if (! $this->isDuplicateKeyException($e)) {
                    throw $e;
                }
            }
        }

        throw new RuntimeException(
            "Failed to generate unique barcode for variant {$variant->id} after ".self::MAX_RETRY_ATTEMPTS.' attempts.'
        );
    }

    /**
     * Batch generate barcodes for multiple variants.
     * All-or-nothing: if any generation fails, none are committed.
     *
     * @param  array<int>  $variantIds
     * @return array<int, string> Variant ID => barcode mapping
     *
     * @throws RuntimeException|Throwable If any barcode generation fails
     */
    public function batchGenerate(array $variantIds): array
    {
        return DB::transaction(function () use ($variantIds) {
            $results = [];

            $variants = ProductVariant::query()
                ->with('product')
                ->whereIn('id', $variantIds)
                ->whereNull('barcode')
                ->get();

            foreach ($variants as $variant) {
                $tenantId = $variant->product->tenant_id;
                $sequence = $this->getNextSequence($tenantId);
                $barcode = $this->buildEAN13($tenantId, $sequence);

                $variant->update(['barcode' => $barcode]);
                $results[$variant->id] = $barcode;
            }

            return $results;
        });
    }

    /**
     * Validate an EAN-13 barcode string.
     */
    public function validateEAN13(string $barcode): bool
    {
        if (! preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        $expectedCheckDigit = $this->calculateCheckDigit(substr($barcode, 0, 12));

        return $barcode[12] === $expectedCheckDigit;
    }

    /**
     * Generate a SKU-based reference string.
     * This is NOT a Code-128 barcode — it's a human-readable product reference.
     *
     * Format: SW-{TTTT}-{SSSSSSS}
     */
    public function generateSkuReference(ProductVariant $variant): string
    {
        if ($variant->sku) {
            return $variant->sku;
        }

        $tenantId = $variant->product->tenant_id;
        $sequence = $this->getNextSequence($tenantId);

        return sprintf('SW-%04d-%07d', $tenantId % 10000, $sequence);
    }

    /**
     * Build a complete EAN-13 barcode from tenant ID and sequence number.
     */
    private function buildEAN13(int $tenantId, int $sequence): string
    {
        $tenantPrefix = str_pad($tenantId % 10000, self::TENANT_DIGITS, '0', STR_PAD_LEFT);
        $sequenceStr = str_pad($sequence % 10000000, self::SEQUENCE_DIGITS, '0', STR_PAD_LEFT);

        $base = self::INTERNAL_PREFIX.$tenantPrefix.$sequenceStr;

        return $base.$this->calculateCheckDigit($base);
    }

    /**
     * Calculate the EAN-13 check digit for a 12-digit base string.
     * Per GS1 specification: alternating ×1 and ×3 weights, check digit = (10 - sum%10) % 10.
     */
    private function calculateCheckDigit(string $base): string
    {
        $sum = 0;

        for ($i = 0; $i < 12; $i++) {
            $sum += (int) $base[$i] * (($i % 2 === 0) ? 1 : 3);
        }

        return (string) ((10 - ($sum % 10)) % 10);
    }

    /**
     * Get the next sequence number for a tenant's barcode space.
     * Must be called within a transaction for the lock to hold.
     */
    private function getNextSequence(int $tenantId): int
    {
        $tenantPrefix = str_pad($tenantId % 10000, self::TENANT_DIGITS, '0', STR_PAD_LEFT);
        $pattern = self::INTERNAL_PREFIX.$tenantPrefix.'%';

        $lastBarcode = ProductVariant::query()
            ->whereHas('product', fn ($q) => $q->where('tenant_id', $tenantId))
            ->whereNotNull('barcode')
            ->where('barcode', 'like', $pattern)
            ->lockForUpdate()
            ->orderByDesc('barcode')
            ->value('barcode');

        if (! $lastBarcode) {
            return 1;
        }

        return (int) substr($lastBarcode, 1 + self::TENANT_DIGITS, self::SEQUENCE_DIGITS) + 1;
    }

    /**
     * Detect whether a QueryException is a unique constraint violation.
     * Covers PostgreSQL (23505), MySQL (1062), and SQLite (19/UNIQUE).
     */
    private function isDuplicateKeyException(QueryException $e): bool
    {
        $code = (string) $e->getCode();

        return $code === '23505'
            || $code === '23000'
            || str_contains($e->getMessage(), 'Duplicate entry')
            || str_contains($e->getMessage(), 'UNIQUE constraint failed');
    }
}
