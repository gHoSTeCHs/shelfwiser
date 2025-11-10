<?php

namespace App\Services\ShopConfigHandlers;

use Illuminate\Support\Facades\Validator;

class PharmacyConfigHandler implements \App\Contracts\ShopConfigHandler
{
    public function validate(array $config): bool
    {
        return Validator::make($config, [
            'dea_number' => 'required|string|size:9',
            'rx_validation_endpoint' => 'required|url|starts_with:https',
            'controlled_substance_tracking' => 'required|boolean',
            'insurance_claim_integration' => 'required|array',
            'insurance_claim_integration.enabled' => 'boolean',
            'insurance_claim_integration.provider' => 'required_if:insurance_claim_integration.enabled,true|in:surescripts,emdeon',
            'prescription_upload_enabled' => 'boolean',
            'audit_logging' => 'required|boolean',
        ])->passes();
    }

    public function getDefaults(): array
    {
        return [
            'dea_number' => '',
            'rx_validation_endpoint' => 'https://api.fda.gov/rx/verify',
            'controlled_substance_tracking' => true,
            'insurance_claim_integration' => [
                'enabled' => false,
                'provider' => null,
            ],
            'prescription_upload_enabled' => true,
            'audit_logging' => true,
        ];
    }
}
