<?php

namespace App\Contracts;

interface ShopConfigHandler
{
    public function validate(array $config): bool;

    public function getDefaults(): array;
}
