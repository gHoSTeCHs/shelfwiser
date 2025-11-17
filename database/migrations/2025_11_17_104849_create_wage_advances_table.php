<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wage_advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->decimal('amount_requested', 15, 2);
            $table->decimal('amount_approved', 15, 2)->nullable();
            $table->string('status')->default('pending');
            $table->text('reason')->nullable();

            $table->timestamp('requested_at')->useCurrent();

            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->foreignId('disbursed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disbursed_at')->nullable();

            $table->date('repayment_start_date')->nullable();
            $table->integer('repayment_installments')->default(1);
            $table->decimal('amount_repaid', 15, 2)->default(0);
            $table->timestamp('fully_repaid_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('shop_id');
            $table->index('approved_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wage_advances');
    }
};
