<?php

namespace Database\Seeders;

use App\Models\TaxJurisdiction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TaxJurisdictionSeeder extends Seeder
{
    public function run(): void
    {
        $jurisdictions = [
            [
                'name' => 'Nigeria - Federal',
                'code' => 'NG-FED',
                'country_code' => 'NG',
                'state_province' => null,
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Nigeria - Lagos State',
                'code' => 'NG-LA',
                'country_code' => 'NG',
                'state_province' => 'Lagos',
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Nigeria - Abuja (FCT)',
                'code' => 'NG-FC',
                'country_code' => 'NG',
                'state_province' => 'Federal Capital Territory',
                'city' => 'Abuja',
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Nigeria - Kano State',
                'code' => 'NG-KN',
                'country_code' => 'NG',
                'state_province' => 'Kano',
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Nigeria - Rivers State',
                'code' => 'NG-RI',
                'country_code' => 'NG',
                'state_province' => 'Rivers',
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'United States - Federal',
                'code' => 'US-FED',
                'country_code' => 'US',
                'state_province' => null,
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
            [
                'name' => 'United Kingdom',
                'code' => 'GB-UK',
                'country_code' => 'GB',
                'state_province' => null,
                'city' => null,
                'effective_from' => Carbon::parse('2020-01-01'),
                'effective_to' => null,
                'is_active' => true,
            ],
        ];

        foreach ($jurisdictions as $jurisdiction) {
            TaxJurisdiction::updateOrCreate(
                ['code' => $jurisdiction['code']],
                $jurisdiction
            );
        }
    }
}
