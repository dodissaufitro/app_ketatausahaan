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
        Schema::create('download_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('module'); // 'angkutan_umum', 'attendance', etc
            $table->boolean('can_download')->default(false);
            $table->unsignedBigInteger('granted_by'); // super admin yang memberikan akses
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('granted_by')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'module']); // satu user, satu module, satu permission
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('download_permissions');
    }
};
