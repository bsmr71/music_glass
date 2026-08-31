<?php

namespace App\Http\Controllers;

use App\Services\LyricsService;
use App\Services\YouTubeMusicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MusicController extends Controller
{
    protected YouTubeMusicService $ytService;
    protected LyricsService $lyricsService;

    public function __construct(YouTubeMusicService $ytService, LyricsService $lyricsService)
    {
        $this->ytService = $ytService;
        $this->lyricsService = $lyricsService;
    }

    /**
     * Search songs, albums, artists
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $filter = $request->query('filter', 'all');

        if (empty(trim($query))) {
            return response()->json(['results' => []]);
        }

        $results = $this->ytService->search($query, $filter);
        return response()->json([
            'query' => $query,
            'filter' => $filter,
            'count' => count($results),
            'results' => $results
        ]);
    }

    /**
     * Get explore feed and curated categories
     */
    public function trending(): JsonResponse
    {
        $feed = $this->ytService->getExploreFeed();
        return response()->json($feed);
    }

    /**
     * Resolve audio stream URL
     */
    public function stream(Request $request, string $id): JsonResponse
    {
        $stream = $this->ytService->resolveAudioStream($id);
        return response()->json($stream);
    }

    /**
     * Get synchronized karaoke LRC lyrics
     */
    public function lyrics(Request $request): JsonResponse
    {
        $title = $request->query('title', '');
        $artist = $request->query('artist', '');
        $album = $request->query('album', '');
        $duration = $request->query('duration') ? (int)$request->query('duration') : null;

        if (empty($title)) {
            return response()->json([
                'found' => false,
                'isSynced' => false,
                'synced' => [],
                'plain' => 'No title provided.'
            ]);
        }

        $lyrics = $this->lyricsService->getLyrics($title, $artist, $album, $duration);
        return response()->json($lyrics);
    }
}
