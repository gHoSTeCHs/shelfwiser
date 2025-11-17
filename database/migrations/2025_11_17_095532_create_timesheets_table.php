<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timesheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->date('date');
            $table->dateTime('clock_in')->nullable();
            $table->dateTime('clock_out')->nullable();

            $table->dateTime('break_start')->nullable();
            $table->dateTime('break_end')->nullable();
            $table->integer('break_duration_minutes')->default(0);

            $table->decimal('regular_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->decimal('total_hours', 5, 2)->default(0);

            $table->text('notes')->nullable();

            $table->string('status')->default('draft');

            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'shop_id', 'date']);
            $table->index(['user_id', 'status']);
            $table->index(['status', 'approved_by_user_id']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheets');
    }
};
