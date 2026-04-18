<?php

use App\Enums\StockMovementType;

it('RETURN type is classified as increase', function () {
    expect(StockMovementType::RETURN->isIncrease())->toBeTrue();
    expect(StockMovementType::RETURN->isDecrease())->toBeFalse();
});
