<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConvxApiTest extends TestCase
{
    use RefreshDatabase;
    public function test_trending_api(): void
    {
        $response = $this->getJson('/api/music/trending');
        $response->assertStatus(200);
        $response->assertJsonStructure(['quick_picks', 'trending_now', 'genres']);
    }

    public function test_search_api(): void
    {
        $response = $this->getJson('/api/music/search?q=Adele&filter=songs');
        $response->assertStatus(200);
        $response->assertJsonStructure(['results']);
    }

    public function test_favorites_crud(): void
    {
        $toggle = $this->postJson('/api/favorites/toggle', [
            'video_id' => 'test_123',
            'title' => 'Test Song',
            'artist' => 'Test Artist',
            'thumbnail' => 'https://example.com/thumb.jpg'
        ]);
        $toggle->assertStatus(200);
        $toggle->assertJson(['favorited' => true]);

        $list = $this->getJson('/api/favorites');
        $list->assertStatus(200);
        $this->assertNotEmpty($list->json());
    }

    public function test_playlist_crud(): void
    {
        $created = $this->postJson('/api/playlists', [
            'name' => 'My Test Vibe',
            'description' => 'Test playlist',
            'color_accent' => '#8b5cf6'
        ]);
        $created->assertStatus(201);
        $playlistId = $created->json('id');

        $addTrack = $this->postJson("/api/playlists/{$playlistId}/tracks", [
            'video_id' => 'track_1',
            'title' => 'Vibe Track',
            'artist' => 'Artist One'
        ]);
        $addTrack->assertStatus(200);

        $getPlaylist = $this->getJson("/api/playlists/{$playlistId}");
        $getPlaylist->assertStatus(200);
        $this->assertCount(1, $getPlaylist->json('tracks'));
    }

    public function test_room_create_and_get(): void
    {
        $room = $this->postJson('/api/rooms', [
            'name' => 'Party Room'
        ]);
        $room->assertStatus(201);
        $code = $room->json('code');

        $getRoom = $this->getJson("/api/rooms/{$code}");
        $getRoom->assertStatus(200);
        $this->assertEquals($code, $getRoom->json('code'));
    }
}
