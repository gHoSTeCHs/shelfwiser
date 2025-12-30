<?php

namespace Database\Seeders;

use App\Models\TaxRelief;
use App\Models\TaxTable;
use Illuminate\Database\Seeder;

class TaxReliefSeeder extends Seeder
{
    public function run(): void
    {
        $nigeriaTable = TaxTable::where('jurisdiction', 'NG')->first();

        if (! $nigeriaTable) {
            return;
        }

        TaxRelief::create([
            'tax_table_id' => $nigeriaTable->id,
            'code' => 'CRA',
            'name' => 'Consolidated Relief Allowance',
            'description' => 'Higher of NGN 200,000 or 1% of gross income, plus 20% of gross income',
            'relief_type' => 'capped_percentage',
            'amount' => 200000,
            'rate' => 21.00,
            'cap' => null,
            'is_automatic' => true,
            'is_active' => true,
        ]);

        TaxRelief::create([
            'tax_table_id' => $nigeriaTable->id,
            'code' => 'PENSION',
            'name' => 'Pension Relief',
            'description' => 'Employee pension contribution (8% of basic salary)',
            'relief_type' => 'percentage',
            'amount' => null,
            'rate' => 8.00,
            'cap' => null,
            'is_automatic' => true,
            'is_active' => true,
        ]);

        TaxRelief::create([
            'tax_table_id' => $nigeriaTable->id,
            'code' => 'NHF',
            'name' => 'National Housing Fund',
            'description' => '2.5% of basic salary for NHF contribution',
            'relief_type' => 'percentage',
            'amount' => null,
            'rate' => 2.50,
            'cap' => null,
            'is_automatic' => true,
            'is_active' => true,
        ]);
    }
}
