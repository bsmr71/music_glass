<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('playlists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('cover_url')->nullable();
            $table->string('color_accent')->default('#7c3aed');
            $table->timestamps();
        });

        Schema::create('playlist_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained('playlists')->onDelete('cascade');
            $table->string('video_id');
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('album')->nullable();
            $table->string('duration')->nullable();
            $table->string('thumbnail')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->string('video_id')->unique();
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('album')->nullable();
            $table->string('duration')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamps();
        });

        Schema::create('histories', function (Blueprint $table) {
            $table->id();
            $table->string('video_id');
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('album')->nullable();
            $table->string('duration')->nullable();
            $table->string('thumbnail')->nullable();
            $table->timestamp('played_at')->useCurrent();
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->json('current_track')->nullable();
            $table->boolean('is_playing')->default(false);
            $table->float('seek_time')->default(0);
            $table->timestamp('last_sync_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('histories');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('playlist_tracks');
        Schema::dropIfExists('playlists');
    }
};
