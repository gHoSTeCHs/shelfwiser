<?php

namespace App\Helpers;

use App\Models\Shop;

class CurrencyHelper
{
    /**
     * Supported currencies with their default symbols and decimal places.
     */
    private const CURRENCIES = [
        'NGN' => ['symbol' => '₦', 'decimals' => 2, 'name' => 'Nigerian Naira'],
        'USD' => ['symbol' => '$', 'decimals' => 2, 'name' => 'US Dollar'],
        'EUR' => ['symbol' => '€', 'decimals' => 2, 'name' => 'Euro'],
        'GBP' => ['symbol' => '£', 'decimals' => 2, 'name' => 'British Pound'],
        'GHS' => ['symbol' => '₵', 'decimals' => 2, 'name' => 'Ghanaian Cedi'],
        'KES' => ['symbol' => 'KSh', 'decimals' => 2, 'name' => 'Kenyan Shilling'],
        'ZAR' => ['symbol' => 'R', 'decimals' => 2, 'name' => 'South African Rand'],
    ];

    /**
     * Format a price value according to shop's currency settings.
     *
     * @param float|int|string $amount The amount to format
     * @param Shop $shop The shop whose currency settings to use
     * @param bool $includeSymbol Whether to include the currency symbol
     * @return string Formatted price
     */
    public static function format($amount, Shop $shop, bool $includeSymbol = true): string
    {
        $decimals = $shop->currency_decimals ?? 2;
        $formatted = number_format((float) $amount, $decimals, '.', ',');

        if ($includeSymbol) {
            $symbol = $shop->currency_symbol ?? self::getDefaultSymbol($shop->currency);
            return $symbol . $formatted;
        }

        return $formatted;
    }

    /**
     * Format a price value with explicit currency settings.
     *
     * @param float|int|string $amount The amount to format
     * @param string $currencyCode The currency code (e.g., 'NGN', 'USD')
     * @param string|null $symbol Custom currency symbol (optional)
     * @param int $decimals Number of decimal places
     * @param bool $includeSymbol Whether to include the currency symbol
     * @return string Formatted price
     */
    public static function formatWithCurrency(
        $amount,
        string $currencyCode,
        ?string $symbol = null,
        int $decimals = 2,
        bool $includeSymbol = true
    ): string {
        $formatted = number_format((float) $amount, $decimals, '.', ',');

        if ($includeSymbol) {
            $currencySymbol = $symbol ?? self::getDefaultSymbol($currencyCode);
            return $currencySymbol . $formatted;
        }

        return $formatted;
    }

    /**
     * Parse a formatted currency string to a float value.
     *
     * @param string $formattedAmount The formatted amount string
     * @return float The parsed amount
     */
    public static function parse(string $formattedAmount): float
    {
        // Remove all non-numeric characters except dots and minus signs
        $cleaned = preg_replace('/[^\d.-]/', '', $formattedAmount);

        return (float) $cleaned;
    }

    /**
     * Get the default symbol for a currency code.
     *
     * @param string $currencyCode The currency code
     * @return string The currency symbol
     */
    public static function getDefaultSymbol(string $currencyCode): string
    {
        return self::CURRENCIES[strtoupper($currencyCode)]['symbol'] ?? $currencyCode . ' ';
    }

    /**
     * Get the default decimal places for a currency code.
     *
     * @param string $currencyCode The currency code
     * @return int The number of decimal places
     */
    public static function getDefaultDecimals(string $currencyCode): int
    {
        return self::CURRENCIES[strtoupper($currencyCode)]['decimals'] ?? 2;
    }

    /**
     * Get the display name for a currency code.
     *
     * @param string $currencyCode The currency code
     * @return string The currency name
     */
    public static function getCurrencyName(string $currencyCode): string
    {
        return self::CURRENCIES[strtoupper($currencyCode)]['name'] ?? $currencyCode;
    }

    /**
     * Get all supported currencies as options for select inputs.
     *
     * @return array Currency options [code => name]
     */
    public static function getSupportedCurrencies(): array
    {
        $currencies = [];
        foreach (self::CURRENCIES as $code => $info) {
            $currencies[$code] = "{$info['name']} ({$info['symbol']})";
        }

        return $currencies;
    }

    /**
     * Check if a currency code is supported.
     *
     * @param string $currencyCode The currency code to check
     * @return bool Whether the currency is supported
     */
    public static function isSupported(string $currencyCode): bool
    {
        return isset(self::CURRENCIES[strtoupper($currencyCode)]);
    }

    /**
     * Convert amount to smallest currency unit (e.g., cents for USD).
     * Useful for payment gateway integration.
     *
     * @param float|int|string $amount The amount in major units
     * @param Shop $shop The shop whose currency settings to use
     * @return int The amount in smallest units
     */
    public static function toSmallestUnit($amount, Shop $shop): int
    {
        $decimals = $shop->currency_decimals ?? 2;
        $multiplier = pow(10, $decimals);

        return (int) round((float) $amount * $multiplier);
    }

    /**
     * Convert amount from smallest currency unit to major units.
     *
     * @param int $amount The amount in smallest units
     * @param Shop $shop The shop whose currency settings to use
     * @return float The amount in major units
     */
    public static function fromSmallestUnit(int $amount, Shop $shop): float
    {
        $decimals = $shop->currency_decimals ?? 2;
        $divisor = pow(10, $decimals);

        return $amount / $divisor;
    }

    /**
     * Format a price range.
     *
     * @param float|int $min Minimum price
     * @param float|int $max Maximum price
     * @param Shop $shop The shop whose currency settings to use
     * @return string Formatted price range
     */
    public static function formatRange($min, $max, Shop $shop): string
    {
        $minFormatted = self::format($min, $shop);
        $maxFormatted = self::format($max, $shop);

        return "{$minFormatted} - {$maxFormatted}";
    }

    /**
     * Calculate tax amount based on shop settings.
     *
     * @param float|int $amount The base amount
     * @param Shop $shop The shop whose tax settings to use
     * @return float The tax amount
     */
    public static function calculateTax($amount, Shop $shop): float
    {
        if (!$shop->vat_enabled) {
            return 0;
        }

        $rate = $shop->vat_rate / 100;

        if ($shop->vat_inclusive) {
            // Tax is already included in the price, calculate the tax portion
            return ($amount * $rate) / (1 + $rate);
        }

        // Tax needs to be added to the price
        return $amount * $rate;
    }

    /**
     * Get the price excluding tax.
     *
     * @param float|int $amount The amount (may include tax)
     * @param Shop $shop The shop whose tax settings to use
     * @return float The amount excluding tax
     */
    public static function getAmountExcludingTax($amount, Shop $shop): float
    {
        if (!$shop->vat_enabled || !$shop->vat_inclusive) {
            return (float) $amount;
        }

        $rate = $shop->vat_rate / 100;
        return $amount / (1 + $rate);
    }

    /**
     * Get the price including tax.
     *
     * @param float|int $amount The base amount
     * @param Shop $shop The shop whose tax settings to use
     * @return float The amount including tax
     */
    public static function getAmountIncludingTax($amount, Shop $shop): float
    {
        if (!$shop->vat_enabled) {
            return (float) $amount;
        }

        if ($shop->vat_inclusive) {
            return (float) $amount;
        }

        $rate = $shop->vat_rate / 100;
        return $amount * (1 + $rate);
    }
}
