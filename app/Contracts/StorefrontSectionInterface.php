<?php

namespace App\Contracts;

use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Models\Shop;

interface StorefrontSectionInterface
{
    public function type(): string;

    public function label(): string;

    public function description(): string;

    public function category(): SectionCategory;

    public function icon(): string;

    public function variants(): array;

    public function configSchema(): array;

    public function defaultConfig(): array;

    public function resolveData(array $config, Shop $shop): array;

    public function allowedPageTypes(): array;

    public function maxPerPage(): int;

    public function minimumAnimationTier(): StorefrontAnimationTier;
}
