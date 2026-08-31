<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_id',
        'title',
        'artist',
        'album',
        'duration',
        'thumbnail'
    ];
}
