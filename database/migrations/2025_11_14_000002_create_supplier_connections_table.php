<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('buyer_tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->enum('status', ['pending', 'approved', 'active', 'suspended', 'rejected'])->default('pending');
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->string('payment_terms_override')->nullable();
            $table->text('buyer_notes')->nullable();
            $table->text('supplier_notes')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['supplier_tenant_id', 'buyer_tenant_id']);
            $table->index(['supplier_tenant_id', 'status']);
            $table->index(['buyer_tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_connections');
    }
};
