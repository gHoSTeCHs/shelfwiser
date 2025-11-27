<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Services
    |--------------------------------------------------------------------------
    */

    'paystack' => [
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'base_url' => env('PAYSTACK_BASE_URL', 'https://api.paystack.co'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'merchant_email' => env('PAYSTACK_MERCHANT_EMAIL'),
    ],

    'opay' => [
        'secret_key' => env('OPAY_SECRET_KEY'),
        'public_key' => env('OPAY_PUBLIC_KEY'),
        'merchant_id' => env('OPAY_MERCHANT_ID'),
        'base_url' => env('OPAY_BASE_URL', 'https://cashierapi.opayweb.com'),
        'webhook_secret' => env('OPAY_WEBHOOK_SECRET'),
    ],

    'flutterwave' => [
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'encryption_key' => env('FLUTTERWAVE_ENCRYPTION_KEY'),
        'base_url' => env('FLUTTERWAVE_BASE_URL', 'https://api.flutterwave.com/v3'),
        'webhook_secret' => env('FLUTTERWAVE_WEBHOOK_SECRET'),
    ],

    'crypto' => [
        'provider' => env('CRYPTO_PROVIDER', 'nowpayments'),
        'api_key' => env('CRYPTO_API_KEY'),
        'base_url' => env('CRYPTO_BASE_URL', 'https://api.nowpayments.io/v1'),
        'webhook_secret' => env('CRYPTO_WEBHOOK_SECRET'),
        'ipn_secret' => env('CRYPTO_IPN_SECRET'),
    ],

];
