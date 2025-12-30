<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addForeignKeyToPayCalendarId();
        $this->addMissingIndexToTaxBands();
        $this->addMissingIndexToTaxBrackets();
    }

    protected function addForeignKeyToPayCalendarId(): void
    {
        if (Schema::hasColumn('employee_payroll_details', 'pay_calendar_id')) {
            if (! $this->hasForeignKey('employee_payroll_details', 'employee_payroll_details_pay_calendar_id_foreign')) {
                Schema::table('employee_payroll_details', function (Blueprint $table) {
                    $table->foreign('pay_calendar_id')
                        ->references('id')
                        ->on('pay_calendars')
                        ->nullOnDelete();
                });
            }
        }
    }

    protected function addMissingIndexToTaxBands(): void
    {
        if (Schema::hasTable('tax_bands') && Schema::hasColumn('tax_bands', 'tax_table_id')) {
            if (! $this->hasIndex('tax_bands', 'tax_bands_tax_table_id_index')) {
                Schema::table('tax_bands', function (Blueprint $table) {
                    $table->index('tax_table_id');
                });
            }
        }
    }

    protected function addMissingIndexToTaxBrackets(): void
    {
        if (Schema::hasTable('tax_brackets') && Schema::hasColumn('tax_brackets', 'tax_jurisdiction_id')) {
            if (! $this->hasIndex('tax_brackets', 'tax_brackets_tax_jurisdiction_id_index')) {
                Schema::table('tax_brackets', function (Blueprint $table) {
                    $table->index('tax_jurisdiction_id');
                });
            }
        }
    }

    protected function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = $connection->select("PRAGMA index_list('{$table}')");

            return collect($indexes)->contains('name', $indexName);
        }

        $indexes = $connection->select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$indexName]
        );

        return count($indexes) > 0;
    }

    protected function hasForeignKey(string $table, string $foreignKeyName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            return false;
        }

        $database = $connection->getDatabaseName();
        $result = $connection->select(
            "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_TYPE = 'FOREIGN KEY'
             AND TABLE_SCHEMA = ?
             AND TABLE_NAME = ?
             AND CONSTRAINT_NAME = ?",
            [$database, $table, $foreignKeyName]
        );

        return count($result) > 0;
    }

    public function down(): void
    {
        if (Schema::hasTable('tax_brackets') && Schema::hasColumn('tax_brackets', 'tax_jurisdiction_id')) {
            Schema::table('tax_brackets', function (Blueprint $table) {
                $table->dropIndex(['tax_jurisdiction_id']);
            });
        }

        if (Schema::hasTable('tax_bands') && Schema::hasColumn('tax_bands', 'tax_table_id')) {
            Schema::table('tax_bands', function (Blueprint $table) {
                $table->dropIndex(['tax_table_id']);
            });
        }

        if (Schema::hasColumn('employee_payroll_details', 'pay_calendar_id')) {
            Schema::table('employee_payroll_details', function (Blueprint $table) {
                $table->dropForeign(['pay_calendar_id']);
            });
        }
    }
};
