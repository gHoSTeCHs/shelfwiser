<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    |
    | This option controls the default payment gateway that will be used when
    | processing payments. You can change this to any of the gateways listed
    | below or set it via the PAYMENT_GATEWAY environment variable.
    |
    */

    'default' => env('PAYMENT_GATEWAY', 'paystack'),

    /*
    |--------------------------------------------------------------------------
    | Payment Gateways
    |--------------------------------------------------------------------------
    |
    | Here you may register the payment gateway implementations for your
    | application. Each gateway must implement the PaymentGatewayInterface.
    | You can add custom gateways by adding them to this array.
    |
    */

    'gateways' => [
        'paystack' => \App\Services\Payment\Gateways\PaystackGateway::class,
        'opay' => \App\Services\Payment\Gateways\OpayGateway::class,
        'crypto' => \App\Services\Payment\Gateways\CryptoGateway::class,
        'flutterwave' => \App\Services\Payment\Gateways\FlutterwaveGateway::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Routes
    |--------------------------------------------------------------------------
    |
    | Configure the routes used for payment callbacks and webhooks.
    |
    */

    'routes' => [
        'callback_prefix' => 'payment/callback',
        'webhook_prefix' => 'api/webhooks',
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Settings
    |--------------------------------------------------------------------------
    |
    | General payment settings that apply across all gateways.
    |
    */

    'settings' => [
        'verify_on_callback' => env('PAYMENT_VERIFY_ON_CALLBACK', true),
        'log_webhooks' => env('PAYMENT_LOG_WEBHOOKS', true),
        'retry_verification' => env('PAYMENT_RETRY_VERIFICATION', 3),
        'verification_timeout' => env('PAYMENT_VERIFICATION_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    | Default currency and supported currencies for payments.
    |
    */

    'currency' => [
        'default' => env('PAYMENT_CURRENCY', 'NGN'),
        'supported' => ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'EUR', 'GBP'],
    ],

];
