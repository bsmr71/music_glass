<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Playlist extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'cover_url', 'color_accent'];

    public function tracks()
    {
        return $this->hasMany(PlaylistTrack::class)->orderBy('position');
    }
}
