<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    protected $fillable = [
        'session_id',
        'email',
        'ip_address',
        'failed_attempts',
        'block_level',
        'last_attempt_at',
        'blocked_until',
    ];

    protected $casts = [
        'last_attempt_at' => 'datetime',
        'blocked_until' => 'datetime',
    ];

    /**
     * Check if currently blocked
     */
    public function isBlocked(): bool
    {
        if (!$this->blocked_until) {
            return false;
        }

        return now()->lt($this->blocked_until);
    }

    /**
     * Get remaining block time in seconds
     */
    public function remainingBlockTime(): int
    {
        if (!$this->isBlocked()) {
            return 0;
        }

        return now()->diffInSeconds($this->blocked_until, false);
    }
}
