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
        Schema::create('pengadaan', function (Blueprint $table) {
            $table->id();
            $table->integer('no')->nullable();
            $table->string('belanja_operasi')->nullable();
            $table->decimal('jumlah_anggaran', 15, 2)->nullable();
            $table->date('tanggal')->nullable();
            $table->string('jenis_pengadaan')->nullable();
            $table->foreignId('pptk_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('asn_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('non_asn_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengadaan');
    }
};
