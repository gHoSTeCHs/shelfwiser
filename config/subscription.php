<?php

return [
    'plans' => [
        'trial' => [
            'label' => 'Trial',
            'max_shops' => 1,
            'max_users' => 3,
            'max_products' => 50,
        ],
        'basic' => [
            'label' => 'Basic',
            'max_shops' => 2,
            'max_users' => 10,
            'max_products' => 500,
        ],
        'professional' => [
            'label' => 'Professional',
            'max_shops' => 5,
            'max_users' => 25,
            'max_products' => 2000,
        ],
        'enterprise' => [
            'label' => 'Enterprise',
            'max_shops' => 20,
            'max_users' => 100,
            'max_products' => 10000,
        ],
    ],

    'trial_days' => 14,
];
