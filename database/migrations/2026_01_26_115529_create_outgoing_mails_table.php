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
        Schema::create('outgoing_mails', function (Blueprint $table) {
            $table->id();
            $table->string('mail_number')->unique();
            $table->string('recipient');
            $table->string('subject');
            $table->date('sent_date');
            $table->enum('category', ['official', 'invitation', 'notification', 'complaint', 'other'])->default('official');
            $table->enum('priority', ['high', 'medium', 'low'])->default('medium');
            $table->enum('status', ['draft', 'sent', 'delivered', 'archived'])->default('draft');
            $table->text('description')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outgoing_mails');
    }
};
