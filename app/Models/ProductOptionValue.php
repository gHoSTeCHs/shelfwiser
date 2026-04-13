<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $product_option_id
 * @property string $label
 * @property string $value
 * @property array|null $visual_data
 * @property int $position
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class ProductOptionValue extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_option_id',
        'label',
        'value',
        'visual_data',
        'position',
    ];

    protected $casts = [
        'visual_data' => 'array',
        'position' => 'integer',
    ];

    public function option(): BelongsTo
    {
        return $this->belongsTo(ProductOption::class, 'product_option_id');
    }

    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'product_option_value_variant',
            'product_option_value_id',
            'product_variant_id'
        );
    }
}
