<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class YouTubeMusicService
{
    protected string $innerTubeUrl = 'https://music.youtube.com/youtubei/v1';

    protected array $invidiousInstances = [
        'https://inv.tux.pizza',
        'https://invidious.nerdvpn.de',
        'https://yewtu.be',
        'https://invidious.jing.rocks',
        'https://invidious.drgns.space'
    ];

    protected array $pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://api.piped.private.coffee',
        'https://piped-api.garudalinux.org',
        'https://pipedapi.leptons.xyz'
    ];

    /**
     * Search YouTube Music
     */
    public function search(string $query, string $filter = 'all'): array
    {
        $cacheKey = 'ytm_search_' . md5($query . '_' . $filter);

        return Cache::remember($cacheKey, 1800, function () use ($query, $filter) {
            $params = match ($filter) {
                'songs' => 'EgWKAQIIAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D',
                'videos' => 'EgWKAQIQAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D',
                'albums' => 'EgWKAQIYAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D',
                'artists' => 'EgWKAQIgAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D',
                'playlists' => 'EgWKAQIwAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D',
                default => null,
            };

            $payload = [
                'context' => [
                    'client' => [
                        'clientName' => 'WEB_REMIX',
                        'clientVersion' => '1.20240401.01.00',
                        'hl' => 'en',
                        'gl' => 'US'
                    ]
                ],
                'query' => $query,
            ];

            if ($params) {
                $payload['params'] = $params;
            }

            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Origin' => 'https://music.youtube.com',
                    'Referer' => 'https://music.youtube.com/'
                ])->timeout(8)->post($this->innerTubeUrl . '/search', $payload);

                if ($response->successful()) {
                    return $this->parseSearchResults($response->json());
                }
            } catch (\Exception $e) {
                // Fallback to Invidious search
                return $this->fallbackInvidiousSearch($query);
            }

            return $this->fallbackInvidiousSearch($query);
        });
    }

    /**
     * Parse InnerTube Search Results
     */
    protected function parseSearchResults(array $data): array
    {
        $results = [];
        $sections = $data['contents']['tabbedSearchResultsRenderer']['tabs'][0]['tabRenderer']['content']['sectionListRenderer']['contents'] ?? [];

        foreach ($sections as $section) {
            // Check top result card
            if (isset($section['musicCardShelfRenderer'])) {
                $card = $section['musicCardShelfRenderer'];
                $title = $card['title']['runs'][0]['text'] ?? '';
                $meta = $this->parseSubtitleRuns($card['subtitle']['runs'] ?? []);
                $thumb = $card['thumbnailDetails']['thumbnails'][0]['url'] ?? '';
                $thumb = preg_replace('/=w\d+-h\d+/', '=w600-h600', $thumb);
                
                $videoId = $card['onTap']['watchEndpoint']['videoId'] ??
                           $card['buttons'][0]['buttonRenderer']['navigationEndpoint']['watchEndpoint']['videoId'] ?? '';
                           
                $browseId = $card['title']['runs'][0]['navigationEndpoint']['browseEndpoint']['browseId'] ?? 
                            $card['onTap']['browseEndpoint']['browseId'] ?? '';

                if ($videoId && $title) {
                    $results[] = [
                        'id' => $videoId,
                        'title' => $title,
                        'artist' => $meta['artist'],
                        'album' => $meta['album'] ?: 'Top Result',
                        'duration' => $meta['duration'],
                        'thumbnail' => $thumb ?: "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                        'type' => 'song',
                        'isTopResult' => true
                    ];
                } elseif ($browseId && $title) {
                    $results[] = [
                        'id' => $browseId,
                        'title' => $title,
                        'artist' => $meta['artist'] ?: 'Artist',
                        'album' => 'Top Artist',
                        'duration' => '',
                        'thumbnail' => $thumb ?: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
                        'type' => 'artist',
                        'isTopResult' => true
                    ];
                }
            }

            $items = $section['musicShelfRenderer']['contents'] 
                   ?? $section['itemSectionRenderer']['contents'] 
                   ?? [];
            foreach ($items as $item) {
                $renderer = $item['musicResponsiveListItemRenderer'] ?? null;
                if (!$renderer) continue;

                $flexColumns = $renderer['flexColumns'] ?? [];
                if (empty($flexColumns)) continue;

                $firstCol = $flexColumns[0]['musicResponsiveListItemFlexColumnRenderer']['text']['runs'][0] ?? null;
                $title = $firstCol['text'] ?? '';
                
                $videoId = $firstCol['navigationEndpoint']['watchEndpoint']['videoId'] ??
                           $renderer['navigationEndpoint']['watchEndpoint']['videoId'] ??
                           $renderer['playlistItemData']['videoId'] ??
                           $renderer['doubleTapCommand']['watchEndpoint']['videoId'] ?? '';

                // Browse ID for artists / albums
                $browseId = $firstCol['navigationEndpoint']['browseEndpoint']['browseId'] ??
                            $renderer['navigationEndpoint']['browseEndpoint']['browseId'] ??
                            $renderer['doubleTapCommand']['browseEndpoint']['browseId'] ?? '';

                $pageType = $firstCol['navigationEndpoint']['browseEndpoint']['browseEndpointContextSupportedConfigs']['browseEndpointContextMusicConfig']['pageType'] ??
                            $renderer['navigationEndpoint']['browseEndpoint']['browseEndpointContextSupportedConfigs']['browseEndpointContextMusicConfig']['pageType'] ?? '';

                $subtitleRuns = $flexColumns[1]['musicResponsiveListItemFlexColumnRenderer']['text']['runs'] ?? [];
                $meta = $this->parseSubtitleRuns($subtitleRuns);
                $subtitleText = trim(implode('', array_map(fn($r) => $r['text'] ?? '', $subtitleRuns)));

                $thumb = $renderer['thumbnail']['musicThumbnailRenderer']['thumbnail']['thumbnails'][0]['url'] ?? '';
                $thumb = preg_replace('/=w\d+-h\d+/', '=w500-h500', $thumb);

                if ($videoId && $title) {
                    $results[] = [
                        'id' => $videoId,
                        'title' => $title,
                        'artist' => $meta['artist'],
                        'album' => $meta['album'],
                        'duration' => $meta['duration'],
                        'thumbnail' => $thumb ?: "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                        'type' => 'song'
                    ];
                } elseif ($browseId && $title) {
                    $isArtist = $pageType === 'MUSIC_PAGE_TYPE_ARTIST' 
                             || str_starts_with($browseId, 'UC') 
                             || str_contains(strtolower($subtitleText), 'artist') 
                             || str_contains(strtolower($subtitleText), 'subscribers') 
                             || str_contains(strtolower($subtitleText), 'monthly audience');

                    $type = $isArtist ? 'artist' : 'album';
                    $results[] = [
                        'id' => $browseId,
                        'title' => $title,
                        'artist' => $subtitleText ?: ($isArtist ? 'Artist' : 'Album'),
                        'album' => '',
                        'duration' => '',
                        'thumbnail' => $thumb ?: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
                        'type' => $type
                    ];
                }
            }
        }

        return $results;
    }

    /**
     * Parse and clean runs to extract artist, album, and duration
     */
    protected function parseSubtitleRuns(array $runs): array
    {
        $artist = '';
        $album = '';
        $duration = '';

        $skipBadges = ['song', 'video', 'episode', 'single', 'album', 'station', 'playlist', 'podcast', 'channel'];

        // 1. Check runs with explicit music navigation page types
        foreach ($runs as $r) {
            $text = trim($r['text'] ?? '');
            if ($text === '' || $text === '•' || $text === '|') continue;

            $pageType = $r['navigationEndpoint']['browseEndpoint']['browseEndpointContextSupportedConfigs']['browseEndpointContextMusicConfig']['pageType'] ?? '';
            $browseId = $r['navigationEndpoint']['browseEndpoint']['browseId'] ?? '';

            if ($pageType === 'MUSIC_PAGE_TYPE_ARTIST' || str_starts_with($browseId, 'UC')) {
                if (!$artist) $artist = $text;
            } elseif ($pageType === 'MUSIC_PAGE_TYPE_ALBUM' || str_starts_with($browseId, 'MPRE') || str_starts_with($browseId, 'FEmusic_library_album')) {
                if (!$album) $album = $text;
            } elseif (preg_match('/^\d+:\d+(:\d+)?$/', $text)) {
                if (!$duration) $duration = $text;
            }
        }

        // 2. Filter textual runs
        $filtered = [];
        foreach ($runs as $r) {
            $t = trim($r['text'] ?? '');
            if ($t === '' || $t === '•' || $t === '|') continue;
            if (in_array(strtolower($t), $skipBadges)) continue;
            if (preg_match('/^\d+(\.\d+)?[KMBkmb]?\s+(views|plays|subscribers)/i', $t)) continue;
            $filtered[] = $t;
        }

        if (!$artist && !empty($filtered)) {
            $artist = $filtered[0];
            if (!$album && count($filtered) > 1 && !preg_match('/^\d+:\d+(:\d+)?$/', $filtered[1])) {
                $album = $filtered[1];
            }
        }

        if (!$duration) {
            foreach ($filtered as $f) {
                if (preg_match('/^\d+:\d+(:\d+)?$/', $f)) {
                    $duration = $f;
                    break;
                }
            }
        }

        return [
            'artist' => $artist ?: 'Unknown Artist',
            'album' => $album ?: '',
            'duration' => $duration ?: ''
        ];
    }

    /**
     * Fallback Search using Invidious / Piped
     */
    protected function fallbackInvidiousSearch(string $query): array
    {
        foreach ($this->invidiousInstances as $instance) {
            try {
                $resp = Http::timeout(4)->get($instance . '/api/v1/search', [
                    'q' => $query,
                    'type' => 'video'
                ]);
                if ($resp->successful()) {
                    $items = $resp->json();
                    $parsed = [];
                    foreach ($items as $item) {
                        $videoId = $item['videoId'] ?? '';
                        if (!$videoId) continue;
                        $parsed[] = [
                            'id' => $videoId,
                            'title' => $item['title'] ?? '',
                            'artist' => $item['author'] ?? '',
                            'album' => 'YouTube',
                            'duration' => gmdate('i:s', (int)($item['lengthSeconds'] ?? 0)),
                            'thumbnail' => "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                            'type' => 'song'
                        ];
                    }
                    if (!empty($parsed)) return $parsed;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return [];
    }

    /**
     * Get Curated Home Feed & Trending Charts
     */
    public function getExploreFeed(): array
    {
        return Cache::remember('convx_home_explore_feed', 3600, function () {
            // Curated High Quality Sections
            $trending = $this->search('Top Hits 2026 Today', 'songs');
            if (empty($trending)) {
                $trending = $this->search('Trending Music Global', 'songs');
            }

            $chillVibes = $this->search('Chill Lofi Beats Ambient', 'songs');
            $popHits = $this->search('Pop Billboard Top Hits', 'songs');
            $indonesiaHits = $this->search('Lagu Indonesia Populer Terbaru', 'songs');
            $workoutEnergy = $this->search('Workout Gym EDM Phonk', 'songs');
            $kpopHits = $this->search('K-Pop Top Hits Trending', 'songs');

            return [
                'quick_picks' => array_slice($trending, 0, 10),
                'trending_now' => array_slice($trending, 0, 15),
                'indonesia_hits' => array_slice($indonesiaHits, 0, 12),
                'chill_vibes' => array_slice($chillVibes, 0, 12),
                'pop_charts' => array_slice($popHits, 0, 12),
                'workout_energy' => array_slice($workoutEnergy, 0, 12),
                'kpop_hits' => array_slice($kpopHits, 0, 12),
                'genres' => [
                    ['id' => 'chill', 'name' => 'Chill & Lo-Fi', 'color' => 'linear-gradient(135deg, #3b82f6, #06b6d4)', 'icon' => 'moon', 'query' => 'Chill Lofi Beats'],
                    ['id' => 'pop', 'name' => 'Pop & Charts', 'color' => 'linear-gradient(135deg, #ec4899, #f43f5e)', 'icon' => 'flame', 'query' => 'Top Pop Hits'],
                    ['id' => 'indonesia', 'name' => 'Indo Hits', 'color' => 'linear-gradient(135deg, #ef4444, #f97316)', 'icon' => 'globe', 'query' => 'Pop Indonesia Hits'],
                    ['id' => 'workout', 'name' => 'Workout & Phonk', 'color' => 'linear-gradient(135deg, #8b5cf6, #d946ef)', 'icon' => 'zap', 'query' => 'Workout Phonk EDM'],
                    ['id' => 'focus', 'name' => 'Deep Focus & Study', 'color' => 'linear-gradient(135deg, #10b981, #14b8a6)', 'icon' => 'coffee', 'query' => 'Study Piano Focus Instrumental'],
                    ['id' => 'rock', 'name' => 'Rock & Alternative', 'color' => 'linear-gradient(135deg, #f59e0b, #ef4444)', 'icon' => 'activity', 'query' => 'Rock Classics Alternative'],
                    ['id' => 'rnb', 'name' => 'R&B & Soul', 'color' => 'linear-gradient(135deg, #a855f7, #6366f1)', 'icon' => 'heart', 'query' => 'RnB Soul Hits'],
                    ['id' => 'kpop', 'name' => 'K-Pop Trends', 'color' => 'linear-gradient(135deg, #f43f5e, #a855f7)', 'icon' => 'sparkles', 'query' => 'K-Pop Hits']
                ]
            ];
        });
    }

    /**
     * Resolve Direct Audio Streams for HTML5 player & Web Audio Visualizer
     */
    public function resolveAudioStream(string $videoId): array
    {
        $cacheKey = 'yt_stream_' . $videoId;

        return Cache::remember($cacheKey, 900, function () use ($videoId) {
            $streamUrls = [];

            // 1. Try Piped API Instances with fast 1.5s timeout
            foreach (array_slice($this->pipedInstances, 0, 2) as $instance) {
                try {
                    $res = Http::timeout(1.5)->get($instance . '/streams/' . $videoId);
                    if ($res->successful()) {
                        $data = $res->json();
                        $audioStreams = $data['audioStreams'] ?? [];
                        if (!empty($audioStreams)) {
                            // Sort by bitrate descending
                            usort($audioStreams, fn($a, $b) => ($b['bitrate'] ?? 0) <=> ($a['bitrate'] ?? 0));
                            foreach ($audioStreams as $stream) {
                                if (!empty($stream['url'])) {
                                    $streamUrls[] = [
                                        'url' => $stream['url'],
                                        'quality' => ($stream['quality'] ?? 'HQ') . ' (' . round(($stream['bitrate'] ?? 128000) / 1000) . 'kbps)',
                                        'mimeType' => $stream['mimeType'] ?? 'audio/mp4',
                                        'bitrate' => $stream['bitrate'] ?? 128000
                                    ];
                                }
                            }
                            if (!empty($streamUrls)) {
                                return [
                                    'success' => true,
                                    'videoId' => $videoId,
                                    'title' => $data['title'] ?? '',
                                    'artist' => $data['uploader'] ?? '',
                                    'duration' => $data['duration'] ?? 0,
                                    'thumbnail' => $data['thumbnailUrl'] ?? "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                                    'streams' => $streamUrls,
                                    'primaryUrl' => $streamUrls[0]['url'],
                                    'source' => 'piped'
                                ];
                            }
                        }
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            // 2. Try Invidious Instances with fast 1.5s timeout
            foreach (array_slice($this->invidiousInstances, 0, 2) as $instance) {
                try {
                    $res = Http::timeout(1.5)->get($instance . '/api/v1/videos/' . $videoId);
                    if ($res->successful()) {
                        $data = $res->json();
                        $adaptive = $data['adaptiveFormats'] ?? [];
                        foreach ($adaptive as $format) {
                            if (str_starts_with($format['type'] ?? '', 'audio/') && !empty($format['url'])) {
                                $streamUrls[] = [
                                    'url' => $format['url'],
                                    'quality' => round(($format['bitrate'] ?? 128000) / 1000) . 'kbps',
                                    'mimeType' => $format['type'],
                                    'bitrate' => $format['bitrate'] ?? 128000
                                ];
                            }
                        }
                        if (!empty($streamUrls)) {
                            usort($streamUrls, fn($a, $b) => ($b['bitrate'] ?? 0) <=> ($a['bitrate'] ?? 0));
                            return [
                                'success' => true,
                                'videoId' => $videoId,
                                'title' => $data['title'] ?? '',
                                'artist' => $data['author'] ?? '',
                                'duration' => $data['lengthSeconds'] ?? 0,
                                'thumbnail' => "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                                'streams' => $streamUrls,
                                'primaryUrl' => $streamUrls[0]['url'],
                                'source' => 'invidious'
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            // If direct stream fails, YouTube IFrame Player engine on the client handles it seamlessly!
            return [
                'success' => false,
                'videoId' => $videoId,
                'useYoutubeIframe' => true,
                'thumbnail' => "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
                'primaryUrl' => null,
                'streams' => []
            ];
        });
    }
}
