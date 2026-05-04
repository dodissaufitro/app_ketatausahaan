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
        Schema::table('login_attempts', function (Blueprint $table) {
            // Drop old unique constraint
            $table->dropUnique(['email', 'ip_address']);
            
            // Make email nullable
            $table->string('email')->nullable()->change();
            
            // Add session_id as primary tracking identifier
            $table->string('session_id', 100)->after('id')->index();
            
            // Keep ip_address for logging purposes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('login_attempts', function (Blueprint $table) {
            $table->dropIndex(['session_id']);
            $table->dropColumn('session_id');
            $table->string('email')->nullable(false)->change();
            $table->unique(['email', 'ip_address']);
        });
    }
};
