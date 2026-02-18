<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenChecklistItem extends Model
{
    protected $fillable = [
        'pengadaan_id',
        'kategori',
        'no_urut',
        'nama_dokumen',
        'pihak_penanggung_jawab',
        'file_soft_copy',
        'tanggal',
        'nomor',
        'keterangan',
        'is_conditional',
        'conditional_note',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_conditional' => 'boolean',
    ];

    public function pengadaan(): BelongsTo
    {
        return $this->belongsTo(Pengadaan::class);
    }
}
