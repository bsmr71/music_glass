<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlaylistTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'playlist_id',
        'video_id',
        'title',
        'artist',
        'album',
        'duration',
        'thumbnail',
        'position'
    ];

    public function playlist()
    {
        return $this->belongsTo(Playlist::class);
    }
}
