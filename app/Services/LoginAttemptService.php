<?php

namespace App\Services;

use App\Models\LoginAttempt;
use Illuminate\Support\Facades\Log;

class LoginAttemptService
{
    /**
     * Block durations in minutes for each level
     */
    const BLOCK_DURATIONS = [
        1 => 1,      // Level 1: 1 minute
        2 => 60,     // Level 2: 1 hour (60 minutes)
        3 => 1440,   // Level 3: 1 day (1440 minutes)
    ];

    /**
     * Maximum attempts before blocking at each level
     */
    const MAX_ATTEMPTS_PER_LEVEL = 3;

    /**
     * Get or create login attempt record by session ID
     */
    public function getAttempt(string $sessionId, ?string $email = null, ?string $ipAddress = null): LoginAttempt
    {
        return LoginAttempt::firstOrCreate(
            ['session_id' => $sessionId],
            [
                'email' => $email,
                'ip_address' => $ipAddress,
                'failed_attempts' => 0,
                'block_level' => 0,
            ]
        );
    }

    /**
     * Check if session is currently blocked
     */
    public function isBlocked(string $sessionId): array
    {
        $attempt = $this->getAttempt($sessionId);

        if ($attempt->isBlocked()) {
            $remainingSeconds = $attempt->remainingBlockTime();
            $remainingMinutes = ceil($remainingSeconds / 60);

            return [
                'blocked' => true,
                'level' => $attempt->block_level,
                'remaining_seconds' => $remainingSeconds,
                'remaining_minutes' => $remainingMinutes,
                'blocked_until' => $attempt->blocked_until,
            ];
        }

        // If block period has passed, reset the attempt
        if ($attempt->blocked_until && now()->gte($attempt->blocked_until)) {
            $this->resetAttempt($sessionId);
        }

        return [
            'blocked' => false,
            'current_attempts' => $attempt->failed_attempts,
            'block_level' => $attempt->block_level,
        ];
    }

    /**
     * Record a failed login attempt
     */
    public function recordFailedAttempt(string $sessionId, ?string $email = null, ?string $ipAddress = null): array
    {
        $attempt = $this->getAttempt($sessionId, $email, $ipAddress);
        
        // Update email and IP for latest attempt
        if ($email) {
            $attempt->email = $email;
        }
        if ($ipAddress) {
            $attempt->ip_address = $ipAddress;
        }
        
        $attempt->failed_attempts += 1;
        $attempt->last_attempt_at = now();

        // Check if we need to block the user
        if ($attempt->failed_attempts >= self::MAX_ATTEMPTS_PER_LEVEL) {
            $attempt->block_level += 1;
            
            // Maximum block level is 3
            if ($attempt->block_level > 3) {
                $attempt->block_level = 3;
            }

            // Set block duration
            $blockMinutes = self::BLOCK_DURATIONS[$attempt->block_level];
            $attempt->blocked_until = now()->addMinutes($blockMinutes);
            
            // Reset failed attempts counter for next level
            $attempt->failed_attempts = 0;

            $attempt->save();

            Log::warning('Session blocked from login', [
                'session_id' => $sessionId,
                'email' => $email,
                'ip_address' => $ipAddress,
                'block_level' => $attempt->block_level,
                'blocked_until' => $attempt->blocked_until,
            ]);

            return [
                'blocked' => true,
                'block_level' => $attempt->block_level,
                'blocked_until' => $attempt->blocked_until,
                'remaining_minutes' => $blockMinutes,
            ];
        }

        $attempt->save();

        return [
            'blocked' => false,
            'failed_attempts' => $attempt->failed_attempts,
            'remaining_attempts' => self::MAX_ATTEMPTS_PER_LEVEL - $attempt->failed_attempts,
            'block_level' => $attempt->block_level,
        ];
    }

    /**
     * Clear login attempts after successful login
     */
    public function clearAttempts(string $sessionId): void
    {
        LoginAttempt::where('session_id', $sessionId)->delete();

        Log::info('Login attempts cleared after successful login', [
            'session_id' => $sessionId,
        ]);
    }

    /**
     * Reset attempt (after block period ends)
     */
    protected function resetAttempt(string $sessionId): void
    {
        $attempt = $this->getAttempt($sessionId);
        $attempt->failed_attempts = 0;
        $attempt->blocked_until = null;
        // Keep block_level to track progressive blocking
        $attempt->save();
    }

    /**
     * Get block message based on level
     */
    public function getBlockMessage(int $level, int $remainingMinutes): string
    {
        $levelNames = [
            1 => 'pertama (1 menit)',
            2 => 'kedua (1 jam)',
            3 => 'ketiga (1 hari)',
        ];

        $levelName = $levelNames[$level] ?? 'maksimum';
        
        if ($remainingMinutes < 60) {
            $timeText = $remainingMinutes . ' menit';
        } elseif ($remainingMinutes < 1440) {
            $hours = floor($remainingMinutes / 60);
            $timeText = $hours . ' jam';
        } else {
            $days = floor($remainingMinutes / 1440);
            $timeText = $days . ' hari';
        }

        return "Terlalu banyak percobaan login gagal. Akun diblokir level {$levelName}. Silakan coba lagi dalam {$timeText}.";
    }
}
