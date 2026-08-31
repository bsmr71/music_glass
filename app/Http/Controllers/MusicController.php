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

    /**
     * High-speed real-time audio chunk stream proxy (Same-Origin, Zero-CORS, Zero-403)
     */
    public function streamRaw(string $id)
    {
        $bin = base_path('yt-dlp.exe');
        if (!file_exists($bin)) {
            return response()->json(['error' => 'Stream engine not available'], 500);
        }

        $cleanId = escapeshellcmd($id);
        $cmd = '"' . $bin . '" --no-warnings --no-playlist -q -o - -f "140/251/bestaudio" "https://www.youtube.com/watch?v=' . $cleanId . '"';

        return response()->stream(function () use ($cmd) {
            $descriptorspec = [
                0 => ["pipe", "r"],
                1 => ["pipe", "w"],
                2 => ["pipe", "w"]
            ];
            $process = proc_open($cmd, $descriptorspec, $pipes);
            if (is_resource($process)) {
                fclose($pipes[0]);
                while (!feof($pipes[1])) {
                    $buffer = fread($pipes[1], 32768);
                    if ($buffer !== false && strlen($buffer) > 0) {
                        echo $buffer;
                        flush();
                    }
                }
                fclose($pipes[1]);
                fclose($pipes[2]);
                proc_close($process);
            }
        }, 200, [
            'Content-Type' => 'audio/webm',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => '*',
            'X-Accel-Buffering' => 'no'
        ]);
    }
}
