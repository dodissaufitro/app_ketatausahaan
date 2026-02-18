<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OutgoingMail extends Model
{
    protected $fillable = [
        'mail_number',
        'recipient',
        'subject',
        'sent_date',
        'category',
        'priority',
        'status',
        'description',
        'attachment_path',
        'attachment_name',
    ];

    protected $casts = [
        'sent_date' => 'date',
    ];
}
