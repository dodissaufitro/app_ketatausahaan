<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class IncomingMail extends Model
{
    protected $fillable = [
        'mail_number',
        'sender',
        'subject',
        'received_date',
        'category',
        'priority',
        'status',
        'description',
        'attachment_path',
        'attachment_name',
    ];

    protected $casts = [
        'received_date' => 'date',
    ];

    public function getAttachmentUrlAttribute()
    {
        if ($this->attachment_path) {
            return Storage::url($this->attachment_path);
        }
        return null;
    }
}
