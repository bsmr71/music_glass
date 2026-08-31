<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LyricsService
{
    /**
     * Get lyrics for a given track title and artist.
     */
    public function getLyrics(string $title, ?string $artist = null, ?string $album = null, ?int $duration = null): array
    {
        $cleanTitle = $this->cleanTrackTitle($title);
        $cleanArtist = $this->cleanArtistName($artist ?? '');

        // If title contains "Artist - Title" and artist is missing or generic, separate them
        if (str_contains($cleanTitle, ' - ')) {
            $parts = explode(' - ', $cleanTitle, 2);
            $possibleArtist = trim($parts[0]);
            $possibleTitle = trim($parts[1]);

            if (empty($cleanArtist) || strtolower($cleanArtist) === 'unknown artist' || str_contains(strtolower($possibleArtist), strtolower($cleanArtist))) {
                $cleanArtist = $possibleArtist;
                $cleanTitle = $possibleTitle;
            }
        }

        $cacheKey = 'lyrics_' . md5($cleanTitle . '_' . $cleanArtist . '_' . $duration);

        return Cache::remember($cacheKey, 86400 * 7, function () use ($cleanTitle, $cleanArtist, $album, $duration, $title) {
            try {
                $candidates = [];

                // 1. Search with track_name and artist_name parameters if artist is present
                if (!empty($cleanArtist)) {
                    $resp1 = Http::timeout(5)->get('https://lrclib.net/api/search', [
                        'track_name' => $cleanTitle,
                        'artist_name' => $cleanArtist
                    ]);
                    if ($resp1->successful() && is_array($resp1->json())) {
                        foreach ($resp1->json() as $item) {
                            if (isset($item['id'])) $candidates[$item['id']] = $item;
                        }
                    }
                }

                // 2. Search combined query
                $q = trim($cleanTitle . ' ' . $cleanArtist);
                $resp2 = Http::timeout(5)->get('https://lrclib.net/api/search', ['q' => $q]);
                if ($resp2->successful() && is_array($resp2->json())) {
                    foreach ($resp2->json() as $item) {
                        if (isset($item['id'])) $candidates[$item['id']] = $item;
                    }
                }

                // 3. Fallback search with title only if no candidates
                if (empty($candidates)) {
                    $resp3 = Http::timeout(4)->get('https://lrclib.net/api/search', ['q' => $cleanTitle]);
                    if ($resp3->successful() && is_array($resp3->json())) {
                        foreach ($resp3->json() as $item) {
                            if (isset($item['id'])) $candidates[$item['id']] = $item;
                        }
                    }
                }

                if (!empty($candidates)) {
                    $bestItem = $this->rankCandidates($candidates, $cleanTitle, $cleanArtist, $duration);
                    if ($bestItem) {
                        return $this->formatLyricsResponse($bestItem);
                    }
                }

                return [
                    'found' => false,
                    'isSynced' => false,
                    'synced' => [],
                    'plain' => "No lyrics found for this track.",
                    'source' => 'LRCLIB'
                ];
            } catch (\Exception $e) {
                return [
                    'found' => false,
                    'isSynced' => false,
                    'synced' => [],
                    'plain' => "Unable to fetch lyrics: " . $e->getMessage(),
                    'source' => 'LRCLIB'
                ];
            }
        });
    }

    /**
     * Score and rank candidate lyrics from LRCLIB
     */
    protected function rankCandidates(array $candidates, string $targetTitle, string $targetArtist, ?int $duration): ?array
    {
        $targetTitleNorm = strtolower(trim($targetTitle));
        $targetArtistNorm = strtolower(trim($targetArtist));

        $bestScore = -1;
        $bestItem = null;

        foreach ($candidates as $item) {
            $itemTrack = strtolower(trim($item['trackName'] ?? ''));
            $itemArtist = strtolower(trim($item['artistName'] ?? ''));
            $hasSynced = !empty($item['syncedLyrics']);
            $hasPlain = !empty($item['plainLyrics']);

            if (!$hasSynced && !$hasPlain) continue;

            $score = 0;

            // 1. Artist Matching
            if (!empty($targetArtistNorm) && $targetArtistNorm !== 'unknown artist') {
                if ($itemArtist === $targetArtistNorm) {
                    $score += 70;
                } elseif (str_contains($itemArtist, $targetArtistNorm) || str_contains($targetArtistNorm, $itemArtist)) {
                    $score += 50;
                } else {
                    // Mismatched artist: penalize heavily to avoid showing wrong song
                    $score -= 60;
                }
            }

            // 2. Track Title Matching
            if ($itemTrack === $targetTitleNorm) {
                $score += 60;
            } elseif (str_contains($itemTrack, $targetTitleNorm) || str_contains($targetTitleNorm, $itemTrack)) {
                $score += 45;
            }

            // 3. Duration Proximity
            if ($duration && isset($item['duration']) && $item['duration'] > 0) {
                $diff = abs((int)$item['duration'] - $duration);
                if ($diff <= 3) {
                    $score += 25;
                } elseif ($diff <= 10) {
                    $score += 15;
                }
            }

            // 4. Bonus for synced lyrics
            if ($hasSynced) {
                $score += 20;
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestItem = $item;
            }
        }

        // Only return if it meets a reasonable confidence threshold
        return ($bestItem && $bestScore >= 25) ? $bestItem : null;
    }

    /**
     * Clean track title from metadata suffixes
     */
    protected function cleanTrackTitle(string $title): string
    {
        $patterns = [
            '/\[.*?\]/i',
            '/#\S+/i',
            '/\(.*?(official|video|audio|lyric|hd|4k|mv|remastered|version|visualizer|explicit|dance|cover|live).*?\)/i',
            '/\b(official video|official audio|official lyric video|lyric video|music video|hd|4k|audio|mv|full audio)\b/i',
            '/\|.*$/i',
            '/\bft\.?.*$/i',
            '/\bfeat\.?.*$/i',
        ];
        $cleaned = preg_replace($patterns, '', $title);
        // Normalize multiple spaces and trim
        return trim(preg_replace('/\s+/', ' ', $cleaned));
    }

    /**
     * Clean artist name
     */
    protected function cleanArtistName(string $artist): string
    {
        $artist = preg_replace('/ - Topic$/i', '', $artist);
        $artist = preg_replace('/VEVO$/i', '', $artist);
        $artist = preg_replace('/^Video\s*•\s*/i', '', $artist);
        $artist = preg_replace('/^Song\s*•\s*/i', '', $artist);
        return trim($artist);
    }

    /**
     * Format LRCLIB response into parsed timestamped lines
     */
    protected function formatLyricsResponse(array $data): array
    {
        $syncedLyrics = $data['syncedLyrics'] ?? null;
        $plainLyrics = $data['plainLyrics'] ?? '';
        $parsedLines = [];

        if ($syncedLyrics) {
            $lines = explode("\n", $syncedLyrics);
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/', $line, $matches)) {
                    $minutes = (int)$matches[1];
                    $seconds = (float)$matches[2];
                    $time = ($minutes * 60) + $seconds;
                    $text = trim($matches[3]);
                    $parsedLines[] = [
                        'time' => $time,
                        'timeFormatted' => sprintf('%02d:%02d', $minutes, floor($seconds)),
                        'text' => $text
                    ];
                }
            }
        }

        return [
            'found' => true,
            'isSynced' => !empty($parsedLines),
            'synced' => $parsedLines,
            'plain' => $plainLyrics ?: implode("\n", array_column($parsedLines, 'text')),
            'trackName' => $data['trackName'] ?? '',
            'artistName' => $data['artistName'] ?? '',
            'source' => 'LRCLIB'
        ];
    }
}
