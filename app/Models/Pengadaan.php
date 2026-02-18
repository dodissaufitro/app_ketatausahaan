<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pengadaan extends Model
{
    protected $table = 'pengadaan';

    protected $fillable = [
        'belanja_operasi',
        'jumlah_anggaran',
        'tanggal',
        'jenis_pengadaan',
        'pptk_id',
        'asn_id',
        'non_asn_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'jumlah_anggaran' => 'decimal:2',
    ];

    public function pptk(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pptk_id');
    }

    public function asn(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asn_id');
    }

    public function nonAsn(): BelongsTo
    {
        return $this->belongsTo(User::class, 'non_asn_id');
    }
}
