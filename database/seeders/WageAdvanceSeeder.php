<?php

namespace Database\Seeders;

use App\Enums\WageAdvanceStatus;
use App\Models\Shop;
use App\Models\User;
use App\Models\WageAdvance;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class WageAdvanceSeeder extends Seeder
{
    /**
     * Seed wage advances with various statuses and repayment scenarios
     */
    public function run(): void
    {
        $users = User::where('is_customer', false)
            ->where('is_active', true)
            ->whereIn('role', ['sales_rep', 'cashier', 'inventory_clerk'])
            ->with('tenant')
            ->get();

        foreach ($users as $user) {
            $shop = Shop::where('tenant_id', $user->tenant_id)->first();

            if (! $shop) {
                continue;
            }

            $approver = User::where('tenant_id', $user->tenant_id)
                ->whereIn('role', ['store_manager', 'general_manager'])
                ->first();

            $this->createWageAdvancesForUser($user, $shop, $approver);
        }
    }

    /**
     * Create wage advances with different statuses
     */
    protected function createWageAdvancesForUser(User $user, Shop $shop, ?User $approver): void
    {
        $wageAdvances = [
            [
                'amount_requested' => 50000,
                'amount_approved' => 50000,
                'reason' => 'Medical emergency - hospital bills',
                'status' => WageAdvanceStatus::REPAID,
                'repayment_installments' => 2,
                'amount_repaid' => 50000,
                'days_ago' => 60,
            ],
            [
                'amount_requested' => 40000,
                'amount_approved' => 35000,
                'reason' => 'School fees for children',
                'status' => WageAdvanceStatus::REPAYING,
                'repayment_installments' => 3,
                'amount_repaid' => 23333.33,
                'days_ago' => 45,
            ],
            [
                'amount_requested' => 60000,
                'amount_approved' => 60000,
                'reason' => 'Rent payment',
                'status' => WageAdvanceStatus::DISBURSED,
                'repayment_installments' => 2,
                'amount_repaid' => 0,
                'days_ago' => 10,
            ],
            [
                'amount_requested' => 30000,
                'amount_approved' => 30000,
                'reason' => 'Family emergency',
                'status' => WageAdvanceStatus::APPROVED,
                'repayment_installments' => 2,
                'amount_repaid' => 0,
                'days_ago' => 3,
            ],
            [
                'amount_requested' => 45000,
                'amount_approved' => null,
                'reason' => 'Home repairs',
                'status' => WageAdvanceStatus::PENDING,
                'repayment_installments' => 3,
                'amount_repaid' => 0,
                'days_ago' => 1,
            ],
        ];

        foreach ($wageAdvances as $advanceData) {
            $requestedAt = Carbon::now()->subDays($advanceData['days_ago']);

            $data = [
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'tenant_id' => $user->tenant_id,
                'amount_requested' => $advanceData['amount_requested'],
                'amount_approved' => $advanceData['amount_approved'],
                'reason' => $advanceData['reason'],
                'status' => $advanceData['status'],
                'repayment_installments' => $advanceData['repayment_installments'],
                'amount_repaid' => $advanceData['amount_repaid'],
                'requested_at' => $requestedAt,
            ];

            if ($advanceData['status'] !== WageAdvanceStatus::PENDING && $approver) {
                $data['approved_by_user_id'] = $approver->id;
                $data['approved_at'] = $requestedAt->copy()->addHours(12);
            }

            if (in_array($advanceData['status'], [
                WageAdvanceStatus::DISBURSED,
                WageAdvanceStatus::REPAYING,
                WageAdvanceStatus::REPAID,
            ]) && $approver) {
                $data['disbursed_by_user_id'] = $approver->id;
                $data['disbursed_at'] = $requestedAt->copy()->addDay();
                $data['repayment_start_date'] = $requestedAt->copy()->addMonth()->startOfMonth();
            }

            if ($advanceData['status'] === WageAdvanceStatus::REPAID) {
                $data['fully_repaid_at'] = $requestedAt->copy()->addMonths($advanceData['repayment_installments']);
            }

            WageAdvance::create($data);
        }
    }
}
