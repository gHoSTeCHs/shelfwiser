<?php

namespace App\Models;

use App\Enums\OptionVisualType;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $product_id
 * @property int $tenant_id
 * @property string $name
 * @property string|null $display_name
 * @property int $position
 * @property OptionVisualType $visual_type
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ProductOption extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'tenant_id',
        'name',
        'display_name',
        'position',
        'visual_type',
    ];

    protected $casts = [
        'visual_type' => OptionVisualType::class,
        'position' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(ProductOptionValue::class)->orderBy('position');
    }
}
