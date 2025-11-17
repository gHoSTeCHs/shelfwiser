<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\Order;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerCreditSeeder extends Seeder
{
    /**
     * Seed customer credit data for testing
     */
    public function run(): void
    {
        $tenant = Tenant::first();
        $shop = Shop::where('tenant_id', $tenant->id)->first();
        $user = User::where('tenant_id', $tenant->id)->first();

        if (!$tenant || !$shop || !$user) {
            $this->command->warn('Skipping CustomerCreditSeeder: Required data not found');
            return;
        }

        $customers = $this->createCustomersWithCredit($tenant, $shop, $user);

        $this->command->info('Customer Credit data seeded successfully!');
        $this->command->info("Created {$customers->count()} customers with credit accounts");
    }

    /**
     * Create customers with various credit scenarios
     */
    protected function createCustomersWithCredit(Tenant $tenant, Shop $shop, User $user)
    {
        $customers = collect();

        $customers->push($this->createCustomer($tenant, $shop, $user, [
            'first_name' => 'Sarah',
            'last_name' => 'Johnson',
            'email' => 'sarah.johnson@example.com',
            'phone' => '08012345001',
            'credit_limit' => 100000.00,
            'account_balance' => 25000.00,
            'scenario' => 'active_with_balance',
        ]));

        $customers->push($this->createCustomer($tenant, $shop, $user, [
            'first_name' => 'Michael',
            'last_name' => 'Chen',
            'email' => 'michael.chen@example.com',
            'phone' => '08012345002',
            'credit_limit' => 50000.00,
            'account_balance' => 0.00,
            'scenario' => 'active_no_balance',
        ]));

        $customers->push($this->createCustomer($tenant, $shop, $user, [
            'first_name' => 'Grace',
            'last_name' => 'Okafor',
            'email' => 'grace.okafor@example.com',
            'phone' => '08012345003',
            'credit_limit' => 200000.00,
            'account_balance' => 180000.00,
            'scenario' => 'near_limit',
        ]));

        $customers->push($this->createCustomer($tenant, $shop, $user, [
            'first_name' => 'David',
            'last_name' => 'Brown',
            'email' => 'david.brown@example.com',
            'phone' => '08012345004',
            'credit_limit' => 75000.00,
            'account_balance' => 12500.00,
            'scenario' => 'regular_user',
        ]));

        $customers->push($this->createCustomer($tenant, $shop, $user, [
            'first_name' => 'Amina',
            'last_name' => 'Mohammed',
            'email' => 'amina.mohammed@example.com',
            'phone' => '08012345005',
            'credit_limit' => 150000.00,
            'account_balance' => 45000.00,
            'scenario' => 'with_transactions',
        ]));

        return $customers;
    }

    /**
     * Create a customer with credit account and sample transactions
     */
    protected function createCustomer(Tenant $tenant, Shop $shop, User $user, array $data)
    {
        $customer = Customer::create([
            'tenant_id' => $tenant->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => bcrypt('password'),
            'credit_limit' => $data['credit_limit'],
            'account_balance' => $data['account_balance'],
            'total_purchases' => 0,
            'is_active' => true,
        ]);

        if ($data['account_balance'] > 0) {
            $this->createTransactions($customer, $shop, $user, $data['scenario']);
        }

        return $customer;
    }

    /**
     * Create sample transactions for a customer
     */
    protected function createTransactions(Customer $customer, Shop $shop, User $user, string $scenario)
    {
        $balance = 0;

        switch ($scenario) {
            case 'active_with_balance':
                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'charge',
                    'amount' => 45000.00,
                    'balance_before' => $balance,
                    'balance_after' => $balance + 45000,
                    'description' => 'Order ORD-2024-001 charged to account',
                    'recorded_by' => $user->id,
                ]);
                $balance += 45000;

                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'payment',
                    'amount' => 20000.00,
                    'balance_before' => $balance,
                    'balance_after' => $balance - 20000,
                    'description' => 'Payment received via bank_transfer',
                    'reference_number' => 'TRF202400123',
                    'recorded_by' => $user->id,
                ]);
                break;

            case 'near_limit':
                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'charge',
                    'amount' => 180000.00,
                    'balance_before' => $balance,
                    'balance_after' => 180000,
                    'description' => 'Large order ORD-2024-002 charged to account',
                    'recorded_by' => $user->id,
                ]);
                break;

            case 'regular_user':
                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'charge',
                    'amount' => 15000.00,
                    'balance_before' => $balance,
                    'balance_after' => $balance + 15000,
                    'description' => 'Order ORD-2024-003 charged to account',
                    'recorded_by' => $user->id,
                ]);
                $balance += 15000;

                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'payment',
                    'amount' => 2500.00,
                    'balance_before' => $balance,
                    'balance_after' => $balance - 2500,
                    'description' => 'Payment received via cash',
                    'recorded_by' => $user->id,
                ]);
                break;

            case 'with_transactions':
                $charges = [35000, 25000, 15000];
                foreach ($charges as $charge) {
                    CustomerCreditTransaction::create([
                        'customer_id' => $customer->id,
                        'tenant_id' => $customer->tenant_id,
                        'shop_id' => $shop->id,
                        'type' => 'charge',
                        'amount' => $charge,
                        'balance_before' => $balance,
                        'balance_after' => $balance + $charge,
                        'description' => "Order charged to account",
                        'recorded_by' => $user->id,
                    ]);
                    $balance += $charge;
                }

                CustomerCreditTransaction::create([
                    'customer_id' => $customer->id,
                    'tenant_id' => $customer->tenant_id,
                    'shop_id' => $shop->id,
                    'type' => 'payment',
                    'amount' => 30000.00,
                    'balance_before' => $balance,
                    'balance_after' => $balance - 30000,
                    'description' => 'Payment received via mobile_money',
                    'reference_number' => 'MM202400456',
                    'recorded_by' => $user->id,
                ]);
                break;
        }
    }
}
