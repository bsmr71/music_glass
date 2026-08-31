<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'current_track',
        'is_playing',
        'seek_time',
        'last_sync_at'
    ];

    protected $casts = [
        'current_track' => 'array',
        'is_playing' => 'boolean',
        'seek_time' => 'float',
        'last_sync_at' => 'datetime'
    ];
}
