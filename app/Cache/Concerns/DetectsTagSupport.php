<?php

namespace App\Cache\Concerns;

use Illuminate\Support\Facades\Cache;

trait DetectsTagSupport
{
    private static ?bool $tagsAvailable = null;

    protected function tagsAvailable(): bool
    {
        if (self::$tagsAvailable === null) {
            try {
                Cache::tags(['_probe'])->flush();
                self::$tagsAvailable = true;
            } catch (\BadMethodCallException) {
                self::$tagsAvailable = false;
            }
        }

        return self::$tagsAvailable;
    }

    /**
     * @internal For testing only — resets the cached detection result.
     */
    public static function resetTagDetection(): void
    {
        self::$tagsAvailable = null;
    }
}
