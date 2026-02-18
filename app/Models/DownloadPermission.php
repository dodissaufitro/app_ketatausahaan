<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DownloadPermission extends Model
{
    protected $fillable = [
        'user_id',
        'module',
        'can_download',
        'granted_by'
    ];

    protected $casts = [
        'can_download' => 'boolean',
    ];

    /**
     * Get the user that owns the download permission.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the admin who granted this permission.
     */
    public function grantedBy()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Check if a user has download permission for a module.
     */
    public static function hasPermission($userId, $module)
    {
        return self::where('user_id', $userId)
            ->where('module', $module)
            ->where('can_download', true)
            ->exists();
    }
}
