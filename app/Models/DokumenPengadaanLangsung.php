<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenPengadaanLangsung extends Model
{
    protected $table = 'dokumen_pengadaan_langsung';

    protected $fillable = [
        'pengadaan_id',
        'no',
        'dokumen',
        'file',
        'tanggal',
        'nomor',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function pengadaan(): BelongsTo
    {
        return $this->belongsTo(Pengadaan::class, 'pengadaan_id');
    }
}
