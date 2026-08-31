<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class History extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'video_id',
        'title',
        'artist',
        'album',
        'duration',
        'thumbnail',
        'played_at'
    ];

    protected $casts = [
        'played_at' => 'datetime'
    ];
}
