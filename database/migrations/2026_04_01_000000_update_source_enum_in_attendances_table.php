<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Untuk MySQL, kita perlu mengubah enum dengan ALTER TABLE
        DB::statement("ALTER TABLE attendances MODIFY COLUMN source ENUM('manual', 'x601', 'system') DEFAULT 'manual'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan ke enum semula
        DB::statement("ALTER TABLE attendances MODIFY COLUMN source ENUM('manual', 'x601') DEFAULT 'manual'");
    }
};
