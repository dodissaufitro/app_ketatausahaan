<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_id',
        'name',
        'email',
        'phone',
        'department',
        'position',
        'join_date',
        'status',
        'avatar',
        'salary',
    ];

    protected $casts = [
        'join_date' => 'date',
        'salary' => 'decimal:2',
    ];

    /**
     * Get the user associated with this employee.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
