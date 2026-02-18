<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AngkutanUmum extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'angkutan_umum';

    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'tanggal_pelaksanaan',
        'jabatan',
        'angkutan_umum_digunakan',
        'foto_timestamp_keberangkatan',
        'foto_timestamp_kepulangan',
    ];

    protected $casts = [
        'tanggal_pelaksanaan' => 'date',
    ];

    /**
     * Get the user that owns the angkutan umum.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
