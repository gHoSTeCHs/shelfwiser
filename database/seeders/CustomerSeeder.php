<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $shops = Shop::with('tenant')->where('allow_retail_sales', true)->get();

        foreach ($shops as $shop) {
            $customerCount = rand(3, 6);
            $this->createCustomersForShop($shop, $customerCount);
        }
    }

    protected function createCustomersForShop(Shop $shop, int $count): void
    {
        $customerTemplates = $this->getCustomerTemplates();

        $selectedCustomers = array_rand($customerTemplates, min($count, count($customerTemplates)));
        if (! is_array($selectedCustomers)) {
            $selectedCustomers = [$selectedCustomers];
        }

        foreach ($selectedCustomers as $key) {
            $template = $customerTemplates[$key];

            $customer = Customer::create([
                'tenant_id' => $shop->tenant_id,
                'preferred_shop_id' => $shop->id,
                'first_name' => $template['first_name'],
                'last_name' => $template['last_name'],
                'email' => $this->generateUniqueEmail($template['email'], $shop->id),
                'phone' => $template['phone'],
                'password' => Hash::make('password'),
                'is_active' => true,
                'marketing_opt_in' => $template['marketing_opt_in'] ?? false,
                'email_verified_at' => now(),
            ]);

            if (rand(1, 10) > 3) {
                $this->createAddressesForCustomer($customer);
            }
        }
    }

    protected function createAddressesForCustomer(Customer $customer): void
    {
        $addresses = $this->getAddressTemplates();

        $addressCount = rand(1, 2);
        $selectedAddresses = array_rand($addresses, min($addressCount, count($addresses)));
        if (! is_array($selectedAddresses)) {
            $selectedAddresses = [$selectedAddresses];
        }

        $isFirst = true;
        foreach ($selectedAddresses as $key) {
            $template = $addresses[$key];

            CustomerAddress::create([
                'customer_id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'phone' => $customer->phone,
                'address_line_1' => $template['address_line_1'],
                'address_line_2' => $template['address_line_2'] ?? null,
                'city' => $template['city'],
                'state' => $template['state'],
                'postal_code' => $template['postal_code'] ?? null,
                'country' => $template['country'],
                'type' => $isFirst ? 'both' : 'shipping',
                'is_default' => $isFirst,
            ]);

            $isFirst = false;
        }
    }

    protected function getCustomerTemplates(): array
    {
        return [
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john.doe@example.com',
                'phone' => '+234 801 234 5678',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+234 802 345 6789',
                'marketing_opt_in' => false,
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Johnson',
                'email' => 'michael.johnson@example.com',
                'phone' => '+234 803 456 7890',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'Emily',
                'last_name' => 'Williams',
                'email' => 'emily.williams@example.com',
                'phone' => '+234 804 567 8901',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Brown',
                'email' => 'david.brown@example.com',
                'phone' => '+234 805 678 9012',
                'marketing_opt_in' => false,
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Davis',
                'email' => 'sarah.davis@example.com',
                'phone' => '+234 806 789 0123',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'James',
                'last_name' => 'Miller',
                'email' => 'james.miller@example.com',
                'phone' => '+234 807 890 1234',
                'marketing_opt_in' => false,
            ],
            [
                'first_name' => 'Lisa',
                'last_name' => 'Wilson',
                'email' => 'lisa.wilson@example.com',
                'phone' => '+234 808 901 2345',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'Robert',
                'last_name' => 'Moore',
                'email' => 'robert.moore@example.com',
                'phone' => '+234 809 012 3456',
                'marketing_opt_in' => true,
            ],
            [
                'first_name' => 'Jennifer',
                'last_name' => 'Taylor',
                'email' => 'jennifer.taylor@example.com',
                'phone' => '+234 810 123 4567',
                'marketing_opt_in' => false,
            ],
        ];
    }

    protected function getAddressTemplates(): array
    {
        return [
            [
                'address_line_1' => '123 Main Street',
                'address_line_2' => 'Apartment 4B',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '100001',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '45 Victoria Island',
                'address_line_2' => null,
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '101241',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '78 Lekki Phase 1',
                'address_line_2' => 'Block C',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '105102',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '12 Independence Avenue',
                'address_line_2' => null,
                'city' => 'Abuja',
                'state' => 'FCT',
                'postal_code' => '900001',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '56 Ikeja GRA',
                'address_line_2' => 'Suite 12',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '100271',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '34 Ring Road',
                'address_line_2' => null,
                'city' => 'Ibadan',
                'state' => 'Oyo',
                'postal_code' => '200001',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '89 Port Harcourt Road',
                'address_line_2' => 'Floor 3',
                'city' => 'Port Harcourt',
                'state' => 'Rivers',
                'postal_code' => '500001',
                'country' => 'Nigeria',
            ],
            [
                'address_line_1' => '23 Kano Street',
                'address_line_2' => null,
                'city' => 'Kano',
                'state' => 'Kano',
                'postal_code' => '700001',
                'country' => 'Nigeria',
            ],
        ];
    }

    protected function generateUniqueEmail(string $baseEmail, int $shopId): string
    {
        $parts = explode('@', $baseEmail);

        return $parts[0].".shop{$shopId}.".substr(uniqid(), -4).'@'.$parts[1];
    }
}
