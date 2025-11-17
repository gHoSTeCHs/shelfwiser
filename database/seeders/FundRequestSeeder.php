<?php

namespace Database\Seeders;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use App\Models\FundRequest;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class FundRequestSeeder extends Seeder
{
    /**
     * Seed fund requests with various types and statuses
     */
    public function run(): void
    {
        $users = User::where('is_customer', false)
            ->where('is_active', true)
            ->whereIn('role', ['store_manager', 'assistant_manager'])
            ->with('tenant')
            ->get();

        foreach ($users as $user) {
            $shop = Shop::where('tenant_id', $user->tenant_id)->first();

            if (!$shop) {
                continue;
            }

            $approver = User::where('tenant_id', $user->tenant_id)
                ->whereIn('role', ['owner', 'general_manager'])
                ->first();

            $this->createFundRequestsForUser($user, $shop, $approver);
        }
    }

    /**
     * Create multiple fund requests with different statuses
     */
    protected function createFundRequestsForUser(User $user, Shop $shop, ?User $approver): void
    {
        $fundRequests = [
            [
                'request_type' => FundRequestType::REPAIRS,
                'amount' => 50000,
                'description' => 'Emergency repair for broken AC unit in main store',
                'status' => FundRequestStatus::DISBURSED,
                'days_ago' => 20,
            ],
            [
                'request_type' => FundRequestType::FUEL,
                'amount' => 25000,
                'description' => 'Fuel for delivery vehicles - monthly allocation',
                'status' => FundRequestStatus::DISBURSED,
                'days_ago' => 15,
            ],
            [
                'request_type' => FundRequestType::SUPPLIES,
                'amount' => 30000,
                'description' => 'Office supplies and cleaning materials',
                'status' => FundRequestStatus::APPROVED,
                'days_ago' => 5,
            ],
            [
                'request_type' => FundRequestType::MAINTENANCE,
                'amount' => 75000,
                'description' => 'Quarterly maintenance for store equipment',
                'status' => FundRequestStatus::APPROVED,
                'days_ago' => 3,
            ],
            [
                'request_type' => FundRequestType::UTILITIES,
                'amount' => 45000,
                'description' => 'Electricity bill payment for current month',
                'status' => FundRequestStatus::PENDING,
                'days_ago' => 1,
            ],
            [
                'request_type' => FundRequestType::INVENTORY,
                'amount' => 150000,
                'description' => 'Urgent stock replenishment for fast-moving items',
                'status' => FundRequestStatus::PENDING,
                'days_ago' => 0,
            ],
        ];

        foreach ($fundRequests as $requestData) {
            $requestedAt = Carbon::now()->subDays($requestData['days_ago']);

            $data = [
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'tenant_id' => $user->tenant_id,
                'request_type' => $requestData['request_type'],
                'amount' => $requestData['amount'],
                'description' => $requestData['description'],
                'status' => $requestData['status'],
                'requested_at' => $requestedAt,
            ];

            if ($requestData['status'] !== FundRequestStatus::PENDING && $approver) {
                $data['approved_by_user_id'] = $approver->id;
                $data['approved_at'] = $requestedAt->copy()->addHours(12);
            }

            if ($requestData['status'] === FundRequestStatus::DISBURSED && $approver) {
                $data['disbursed_by_user_id'] = $approver->id;
                $data['disbursed_at'] = $requestedAt->copy()->addDay();
            }

            FundRequest::create($data);
        }
    }
}
