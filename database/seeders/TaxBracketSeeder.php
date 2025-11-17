<?php

namespace Database\Seeders;

use App\Models\TaxBracket;
use App\Models\TaxJurisdiction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TaxBracketSeeder extends Seeder
{
    public function run(): void
    {
        $nigeriaFederal = TaxJurisdiction::where('code', 'NG-FED')->first();

        if (!$nigeriaFederal) {
            return;
        }

        $brackets2024 = [
            ['income_from' => 0, 'income_to' => 300000, 'tax_rate' => 7.00, 'bracket_order' => 1],
            ['income_from' => 300000, 'income_to' => 600000, 'tax_rate' => 11.00, 'bracket_order' => 2],
            ['income_from' => 600000, 'income_to' => 1100000, 'tax_rate' => 15.00, 'bracket_order' => 3],
            ['income_from' => 1100000, 'income_to' => 1600000, 'tax_rate' => 19.00, 'bracket_order' => 4],
            ['income_from' => 1600000, 'income_to' => 3200000, 'tax_rate' => 21.00, 'bracket_order' => 5],
            ['income_from' => 3200000, 'income_to' => null, 'tax_rate' => 24.00, 'bracket_order' => 6],
        ];

        foreach ($brackets2024 as $bracket) {
            TaxBracket::create([
                'tax_jurisdiction_id' => $nigeriaFederal->id,
                'income_from' => $bracket['income_from'],
                'income_to' => $bracket['income_to'],
                'tax_rate' => $bracket['tax_rate'],
                'bracket_order' => $bracket['bracket_order'],
                'effective_from' => Carbon::parse('2024-01-01'),
                'effective_to' => Carbon::parse('2025-12-31'),
            ]);
        }

        $brackets2026 = [
            ['income_from' => 0, 'income_to' => 800000, 'tax_rate' => 0.00, 'bracket_order' => 1],
            ['income_from' => 800000, 'income_to' => 1500000, 'tax_rate' => 15.00, 'bracket_order' => 2],
            ['income_from' => 1500000, 'income_to' => 3000000, 'tax_rate' => 18.00, 'bracket_order' => 3],
            ['income_from' => 3000000, 'income_to' => 5000000, 'tax_rate' => 21.00, 'bracket_order' => 4],
            ['income_from' => 5000000, 'income_to' => 50000000, 'tax_rate' => 23.00, 'bracket_order' => 5],
            ['income_from' => 50000000, 'income_to' => null, 'tax_rate' => 25.00, 'bracket_order' => 6],
        ];

        foreach ($brackets2026 as $bracket) {
            TaxBracket::create([
                'tax_jurisdiction_id' => $nigeriaFederal->id,
                'income_from' => $bracket['income_from'],
                'income_to' => $bracket['income_to'],
                'tax_rate' => $bracket['tax_rate'],
                'bracket_order' => $bracket['bracket_order'],
                'effective_from' => Carbon::parse('2026-01-01'),
                'effective_to' => null,
            ]);
        }
    }
}
