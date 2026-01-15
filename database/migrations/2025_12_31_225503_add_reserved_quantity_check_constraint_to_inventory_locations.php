<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE inventory_locations ADD CONSTRAINT chk_reserved_quantity CHECK (reserved_quantity <= quantity)');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('CREATE TABLE inventory_locations_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                product_variant_id INTEGER NOT NULL,
                location_type VARCHAR NOT NULL,
                location_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity <= quantity),
                created_at DATETIME,
                updated_at DATETIME,
                deleted_at DATETIME,
                FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE CASCADE,
                UNIQUE (product_variant_id, location_type, location_id)
            )');

            DB::statement('INSERT INTO inventory_locations_new
                SELECT id, product_variant_id, location_type, location_id, quantity, reserved_quantity, created_at, updated_at, deleted_at
                FROM inventory_locations');

            DB::statement('DROP TABLE inventory_locations');

            DB::statement('ALTER TABLE inventory_locations_new RENAME TO inventory_locations');

            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE inventory_locations DROP CONSTRAINT chk_reserved_quantity');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('CREATE TABLE inventory_locations_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                product_variant_id INTEGER NOT NULL,
                location_type VARCHAR NOT NULL,
                location_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                reserved_quantity INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME,
                deleted_at DATETIME,
                FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE CASCADE,
                UNIQUE (product_variant_id, location_type, location_id)
            )');

            DB::statement('INSERT INTO inventory_locations_new
                SELECT id, product_variant_id, location_type, location_id, quantity, reserved_quantity, created_at, updated_at, deleted_at
                FROM inventory_locations');

            DB::statement('DROP TABLE inventory_locations');

            DB::statement('ALTER TABLE inventory_locations_new RENAME TO inventory_locations');

            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
