<?php

namespace App\Http\Requests\Auth;

use App\Services\LoginAttemptService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
    
    /**
     * Get LoginAttemptService instance
     */
    protected function getLoginAttemptService(): LoginAttemptService
    {
        return app(LoginAttemptService::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            // Record failed attempt
            $result = $this->getLoginAttemptService()->recordFailedAttempt(
                $this->session()->getId(),
                $this->input('email'),
                $this->ip()
            );

            if ($result['blocked']) {
                // User is now blocked
                $message = $this->getLoginAttemptService()->getBlockMessage(
                    $result['block_level'],
                    $result['remaining_minutes']
                );

                throw ValidationException::withMessages([
                    'email' => $message,
                ]);
            }

            // Not blocked yet, show remaining attempts
            $message = 'Email atau password salah.';
            if ($result['remaining_attempts'] > 0) {
                $message .= " Sisa percobaan: {$result['remaining_attempts']} kali.";
            }

            throw ValidationException::withMessages([
                'email' => $message,
            ]);
        }

        // Clear attempts on successful login
        $this->getLoginAttemptService()->clearAttempts(
            $this->session()->getId()
        );
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        $blockStatus = $this->getLoginAttemptService()->isBlocked(
            $this->session()->getId()
        );

        if ($blockStatus['blocked']) {
            event(new Lockout($this));

            $message = $this->getLoginAttemptService()->getBlockMessage(
                $blockStatus['level'],
                $blockStatus['remaining_minutes']
            );

            throw ValidationException::withMessages([
                'email' => $message,
            ]);
        }
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
