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
        Schema::table('dokumen_pengadaan_langsung', function (Blueprint $table) {
            $table->foreignId('pengadaan_id')->nullable()->after('id')->constrained('pengadaan')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dokumen_pengadaan_langsung', function (Blueprint $table) {
            $table->dropForeign(['pengadaan_id']);
            $table->dropColumn('pengadaan_id');
        });
    }
};
