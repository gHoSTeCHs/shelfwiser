<?php

namespace App\Services\Payment;

use App\Exceptions\InvalidPaymentGatewayException;
use Illuminate\Support\Facades\App;

/**
 * Manager for payment gateway instances.
 *
 * Provides a factory pattern to resolve and manage payment gateway implementations.
 * Allows registration of custom gateways and retrieval of available gateways.
 */
class PaymentGatewayManager
{
    /**
     * Registered gateway class mappings.
     */
    protected array $gateways = [];

    /**
     * Resolved gateway instances.
     */
    protected array $resolved = [];

    public function __construct()
    {
        $this->registerDefaultGateways();
    }

    /**
     * Register default gateway implementations.
     */
    protected function registerDefaultGateways(): void
    {
        $this->gateways = config('payment.gateways', [
            'paystack' => \App\Services\Payment\Gateways\PaystackGateway::class,
            'opay' => \App\Services\Payment\Gateways\OpayGateway::class,
            'crypto' => \App\Services\Payment\Gateways\CryptoGateway::class,
            'flutterwave' => \App\Services\Payment\Gateways\FlutterwaveGateway::class,
        ]);
    }

    /**
     * Get a gateway instance by identifier.
     *
     * @param string $identifier Gateway identifier
     * @return PaymentGatewayInterface
     * @throws InvalidPaymentGatewayException
     */
    public function gateway(string $identifier): PaymentGatewayInterface
    {
        if (isset($this->resolved[$identifier])) {
            return $this->resolved[$identifier];
        }

        if (!isset($this->gateways[$identifier])) {
            throw new InvalidPaymentGatewayException(
                "Payment gateway [{$identifier}] is not registered."
            );
        }

        $gatewayClass = $this->gateways[$identifier];

        if (!class_exists($gatewayClass)) {
            throw new InvalidPaymentGatewayException(
                "Payment gateway class [{$gatewayClass}] does not exist."
            );
        }

        $gateway = App::make($gatewayClass);

        if (!$gateway instanceof PaymentGatewayInterface) {
            throw new InvalidPaymentGatewayException(
                "Gateway [{$identifier}] must implement PaymentGatewayInterface."
            );
        }

        $this->resolved[$identifier] = $gateway;

        return $gateway;
    }

    /**
     * Get the default payment gateway.
     *
     * @return PaymentGatewayInterface
     */
    public function getDefault(): PaymentGatewayInterface
    {
        $default = config('payment.default', 'paystack');
        return $this->gateway($default);
    }

    /**
     * Register a custom gateway.
     *
     * @param string $identifier Gateway identifier
     * @param string $gatewayClass Fully qualified class name
     */
    public function register(string $identifier, string $gatewayClass): void
    {
        $this->gateways[$identifier] = $gatewayClass;
        unset($this->resolved[$identifier]);
    }

    /**
     * Check if a gateway is registered.
     *
     * @param string $identifier Gateway identifier
     * @return bool
     */
    public function has(string $identifier): bool
    {
        return isset($this->gateways[$identifier]);
    }

    /**
     * Get all available (configured) gateways.
     *
     * @return array<string, PaymentGatewayInterface>
     */
    public function getAvailable(): array
    {
        $available = [];

        foreach (array_keys($this->gateways) as $identifier) {
            try {
                $gateway = $this->gateway($identifier);
                if ($gateway->isAvailable()) {
                    $available[$identifier] = $gateway;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return $available;
    }

    /**
     * Get all registered gateway identifiers.
     *
     * @return array<string>
     */
    public function getRegistered(): array
    {
        return array_keys($this->gateways);
    }

    /**
     * Get gateway options for select dropdowns.
     *
     * @param bool $onlyAvailable Only include available gateways
     * @return array<string, string>
     */
    public function getSelectOptions(bool $onlyAvailable = true): array
    {
        $options = [];
        $gateways = $onlyAvailable ? $this->getAvailable() : $this->getAllGateways();

        foreach ($gateways as $identifier => $gateway) {
            $options[$identifier] = $gateway->getName();
        }

        return $options;
    }

    /**
     * Get all gateway instances (available or not).
     *
     * @return array<string, PaymentGatewayInterface>
     */
    protected function getAllGateways(): array
    {
        $all = [];

        foreach (array_keys($this->gateways) as $identifier) {
            try {
                $all[$identifier] = $this->gateway($identifier);
            } catch (\Exception $e) {
                continue;
            }
        }

        return $all;
    }

    /**
     * Find gateway by webhook URL or other identifier.
     *
     * @param string $identifier
     * @return PaymentGatewayInterface|null
     */
    public function findByIdentifier(string $identifier): ?PaymentGatewayInterface
    {
        try {
            return $this->gateway($identifier);
        } catch (InvalidPaymentGatewayException $e) {
            return null;
        }
    }
}
