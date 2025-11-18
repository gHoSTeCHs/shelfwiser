<?php

namespace App\Exceptions;

use Exception;

class TenantLimitExceededException extends Exception
{
    public function __construct(string $message = 'Tenant limit exceeded')
    {
        parent::__construct($message, 422);
    }
}
