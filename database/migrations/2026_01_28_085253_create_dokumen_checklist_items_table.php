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
        Schema::create('dokumen_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengadaan_id')->constrained('pengadaan')->cascadeOnDelete();
            $table->string('kategori');
            $table->integer('no_urut');
            $table->string('nama_dokumen');
            $table->string('pihak_penanggung_jawab');
            $table->string('file_soft_copy')->nullable();
            $table->date('tanggal')->nullable();
            $table->string('nomor')->nullable();
            $table->text('keterangan')->nullable();
            $table->boolean('is_conditional')->default(false);
            $table->string('conditional_note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_checklist_items');
    }
};
