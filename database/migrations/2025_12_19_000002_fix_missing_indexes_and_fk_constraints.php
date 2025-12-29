<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->fixDuplicateSoftDeletesInPayslips();
        $this->addForeignKeyToPayCalendarId();
        $this->addMissingIndexToTaxBands();
        $this->addMissingIndexToTaxBrackets();
    }

    /**
     * Fix duplicate softDeletes() issue in payslips table
     * D2: Remove duplicate deleted_at column if it exists twice
     */
    protected function fixDuplicateSoftDeletesInPayslips(): void
    {
        if (Schema::hasColumn('payslips', 'deleted_at')) {
            $columns = DB::select("PRAGMA table_info(payslips)");
            $deletedAtCount = collect($columns)->filter(function ($column) {
                return $column->name === 'deleted_at';
            })->count();

            if ($deletedAtCount > 1) {
                DB::statement('
                    CREATE TABLE payslips_temp AS
                    SELECT id, tenant_id, user_id, payroll_period_id, pay_run_id, basic_salary, gross_pay,
                           total_deductions, total_statutory_deductions, total_benefits, net_pay,
                           hours_worked, hourly_rate, overtime_hours, overtime_pay, paye_tax,
                           pension_employee, pension_employer, nhf, nsitf, itf, notes, status,
                           cancellation_reason, cancelled_by, cancelled_at, created_at, updated_at,
                           MIN(deleted_at) as deleted_at
                    FROM payslips
                    GROUP BY id
                ');

                DB::statement('DROP TABLE payslips');
                DB::statement('ALTER TABLE payslips_temp RENAME TO payslips');

                Schema::table('payslips', function (Blueprint $table) {
                    $table->index(['tenant_id', 'user_id']);
                    $table->unique(['payroll_period_id', 'user_id'], 'payslips_period_user_unique');
                    $table->index('created_at');
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                    $table->foreign('payroll_period_id')->references('id')->on('payroll_periods')->restrictOnDelete();
                    $table->foreign('pay_run_id')->references('id')->on('pay_runs')->nullOnDelete();
                    $table->foreign('cancelled_by')->references('id')->on('users')->nullOnDelete();
                });
            }
        }
    }

    /**
     * Add foreign key constraint to pay_calendar_id in employee_payroll_details
     * D3: Missing FK constraint
     */
    protected function addForeignKeyToPayCalendarId(): void
    {
        if (Schema::hasColumn('employee_payroll_details', 'pay_calendar_id')) {
            $foreignKeys = DB::select("
                SELECT sql FROM sqlite_master
                WHERE type='table' AND name='employee_payroll_details'
            ");

            $hasForeignKey = false;
            if (!empty($foreignKeys)) {
                $sql = $foreignKeys[0]->sql;
                $hasForeignKey = str_contains($sql, 'FOREIGN KEY (`pay_calendar_id`)') ||
                                str_contains($sql, 'FOREIGN KEY (pay_calendar_id)');
            }

            if (!$hasForeignKey) {
                Schema::table('employee_payroll_details', function (Blueprint $table) {
                    $table->foreign('pay_calendar_id')
                          ->references('id')
                          ->on('pay_calendars')
                          ->nullOnDelete();
                });
            }
        }
    }

    /**
     * Add missing index to tax_bands table on tax_table_id
     * D10: Missing index for FK column
     */
    protected function addMissingIndexToTaxBands(): void
    {
        if (Schema::hasTable('tax_bands') && Schema::hasColumn('tax_bands', 'tax_table_id')) {
            $indexes = DB::select("PRAGMA index_list('tax_bands')");
            $hasIndex = false;

            foreach ($indexes as $index) {
                $indexInfo = DB::select("PRAGMA index_info('{$index->name}')");
                foreach ($indexInfo as $column) {
                    if ($column->name === 'tax_table_id' && count($indexInfo) === 1) {
                        $hasIndex = true;
                        break 2;
                    }
                }
            }

            if (!$hasIndex) {
                Schema::table('tax_bands', function (Blueprint $table) {
                    $table->index('tax_table_id');
                });
            }
        }
    }

    /**
     * Add missing index to tax_brackets table on tax_jurisdiction_id
     * D11: Missing standalone index for FK column
     */
    protected function addMissingIndexToTaxBrackets(): void
    {
        if (Schema::hasTable('tax_brackets') && Schema::hasColumn('tax_brackets', 'tax_jurisdiction_id')) {
            $indexes = DB::select("PRAGMA index_list('tax_brackets')");
            $hasIndex = false;

            foreach ($indexes as $index) {
                $indexInfo = DB::select("PRAGMA index_info('{$index->name}')");
                foreach ($indexInfo as $column) {
                    if ($column->name === 'tax_jurisdiction_id' && count($indexInfo) === 1) {
                        $hasIndex = true;
                        break 2;
                    }
                }
            }

            if (!$hasIndex) {
                Schema::table('tax_brackets', function (Blueprint $table) {
                    $table->index('tax_jurisdiction_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
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
