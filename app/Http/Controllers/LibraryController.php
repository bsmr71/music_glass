<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\History;
use App\Models\Playlist;
use App\Models\PlaylistTrack;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    // ==================== PLAYLISTS ====================

    public function getPlaylists(): JsonResponse
    {
        $playlists = Playlist::with(['tracks'])->latest()->get();
        return response()->json($playlists);
    }

    public function createPlaylist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'color_accent' => 'nullable|string|max:20'
        ]);

        $playlist = Playlist::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'color_accent' => $validated['color_accent'] ?? '#7c3aed'
        ]);

        return response()->json($playlist->load('tracks'), 201);
    }

    public function getPlaylist(int $id): JsonResponse
    {
        $playlist = Playlist::with('tracks')->findOrFail($id);
        return response()->json($playlist);
    }

    public function updatePlaylist(Request $request, int $id): JsonResponse
    {
        $playlist = Playlist::findOrFail($id);
        $playlist->update($request->only(['name', 'description', 'color_accent']));
        return response()->json($playlist->load('tracks'));
    }

    public function deletePlaylist(int $id): JsonResponse
    {
        $playlist = Playlist::findOrFail($id);
        $playlist->delete();
        return response()->json(['message' => 'Playlist deleted successfully']);
    }

    public function addTrackToPlaylist(Request $request, int $id): JsonResponse
    {
        $playlist = Playlist::findOrFail($id);

        $validated = $request->validate([
            'video_id' => 'required|string',
            'title' => 'required|string',
            'artist' => 'nullable|string',
            'album' => 'nullable|string',
            'duration' => 'nullable|string',
            'thumbnail' => 'nullable|string',
        ]);

        $maxPos = $playlist->tracks()->max('position') ?? 0;

        $track = $playlist->tracks()->create([
            'video_id' => $validated['video_id'],
            'title' => $validated['title'],
            'artist' => $validated['artist'] ?? '',
            'album' => $validated['album'] ?? '',
            'duration' => $validated['duration'] ?? '',
            'thumbnail' => $validated['thumbnail'] ?? '',
            'position' => $maxPos + 1
        ]);

        return response()->json($playlist->load('tracks'));
    }

    public function removeTrackFromPlaylist(int $playlistId, int $trackId): JsonResponse
    {
        $track = PlaylistTrack::where('playlist_id', $playlistId)->where('id', $trackId)->firstOrFail();
        $track->delete();

        $playlist = Playlist::with('tracks')->find($playlistId);
        return response()->json($playlist);
    }

    // ==================== FAVORITES ====================

    public function getFavorites(): JsonResponse
    {
        $favorites = Favorite::latest()->get();
        return response()->json($favorites);
    }

    public function toggleFavorite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'required|string',
            'title' => 'required|string',
            'artist' => 'nullable|string',
            'album' => 'nullable|string',
            'duration' => 'nullable|string',
            'thumbnail' => 'nullable|string',
        ]);

        $existing = Favorite::where('video_id', $validated['video_id'])->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['favorited' => false, 'message' => 'Removed from favorites']);
        }

        $fav = Favorite::create($validated);
        return response()->json(['favorited' => true, 'favorite' => $fav]);
    }

    // ==================== HISTORY ====================

    public function getHistory(): JsonResponse
    {
        $history = History::latest('played_at')->limit(50)->get();
        return response()->json($history);
    }

    public function addHistory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'required|string',
            'title' => 'required|string',
            'artist' => 'nullable|string',
            'album' => 'nullable|string',
            'duration' => 'nullable|string',
            'thumbnail' => 'nullable|string',
        ]);

        $entry = History::create([
            'video_id' => $validated['video_id'],
            'title' => $validated['title'],
            'artist' => $validated['artist'] ?? '',
            'album' => $validated['album'] ?? '',
            'duration' => $validated['duration'] ?? '',
            'thumbnail' => $validated['thumbnail'] ?? '',
            'played_at' => now()
        ]);

        return response()->json($entry, 201);
    }

    public function clearHistory(): JsonResponse
    {
        History::truncate();
        return response()->json(['message' => 'History cleared']);
    }
}
