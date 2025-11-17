<?php

namespace Database\Seeders;

use App\Models\TaxJurisdiction;
use App\Models\TaxRelief;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TaxReliefSeeder extends Seeder
{
    public function run(): void
    {
        $nigeriaFederal = TaxJurisdiction::where('code', 'NG-FED')->first();

        if (!$nigeriaFederal) {
            return;
        }

        TaxRelief::create([
            'tax_jurisdiction_id' => $nigeriaFederal->id,
            'relief_type' => 'cra',
            'calculation_method' => 'cra',
            'amount' => 200000,
            'percentage' => 1.00,
            'cap_amount' => null,
            'formula' => [
                'description' => 'Higher of NGN 200,000 or 1% of gross income, plus 20% of gross income',
                'base' => 'max(200000, gross_income * 0.01)',
                'additional' => 'gross_income * 0.20',
            ],
            'effective_from' => Carbon::parse('2024-01-01'),
            'effective_to' => Carbon::parse('2025-12-31'),
        ]);

        TaxRelief::create([
            'tax_jurisdiction_id' => $nigeriaFederal->id,
            'relief_type' => 'rent_relief',
            'calculation_method' => 'rent_relief',
            'amount' => null,
            'percentage' => 20.00,
            'cap_amount' => 500000,
            'formula' => [
                'description' => '20% of annual rent paid, capped at NGN 500,000',
                'calculation' => 'min(annual_rent_paid * 0.20, 500000)',
            ],
            'effective_from' => Carbon::parse('2026-01-01'),
            'effective_to' => null,
        ]);
    }
}
