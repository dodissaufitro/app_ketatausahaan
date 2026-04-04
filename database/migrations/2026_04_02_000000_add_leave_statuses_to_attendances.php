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
        // Alter enum status column to include leave statuses
        DB::statement("ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'late', 'absent', 'half-day', 'on-leave', 'sick-leave', 'personal-leave', 'maternity-leave', 'paternity-leave') DEFAULT 'present'");

        // Add source column if not exists
        if (!Schema::hasColumn('attendances', 'source')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->enum('source', ['x601', 'manual', 'system', 'leave'])->default('manual')->after('work_hours');
            });
        } else {
            // Update source enum to include 'leave'
            DB::statement("ALTER TABLE attendances MODIFY COLUMN source ENUM('x601', 'manual', 'system', 'leave') DEFAULT 'manual'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert status enum to original values
        DB::statement("ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'late', 'absent', 'half-day') DEFAULT 'present'");

        // Revert source enum (remove 'leave')
        if (Schema::hasColumn('attendances', 'source')) {
            DB::statement("ALTER TABLE attendances MODIFY COLUMN source ENUM('x601', 'manual', 'system') DEFAULT 'manual'");
        }
    }
};
