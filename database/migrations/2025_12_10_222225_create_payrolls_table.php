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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('month'); // Format: YYYY-MM
            $table->decimal('base_salary', 15, 2);
            $table->decimal('allowances', 15, 2)->default(0);
            $table->decimal('deductions', 15, 2)->default(0);
            $table->decimal('late_deductions', 15, 2)->default(0); // Potongan keterlambatan
            $table->integer('late_count')->default(0); // Jumlah keterlambatan
            $table->decimal('net_salary', 15, 2);
            $table->enum('status', ['pending', 'processed', 'paid'])->default('pending');
            $table->timestamps();

            // Index untuk optimasi query
            $table->index(['employee_id', 'month']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
