<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for syncing customers to offline POS.
 * Exposes only the fields the terminal needs for lookup and display.
 */
class SyncCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
