<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ScoreboardController extends Controller
{
    private const CACHE_KEY = 'nhl_scoreboard_match_state';
    private const FILE_BACKUP = 'scoreboard_match_state.json';
    private const MATCHES_CACHE_KEY = 'nhl_scoreboard_matches_list';
    private const MATCHES_FILE_BACKUP = 'scoreboard_matches_list.json';

    /**
     * Return default initial fixtures list.
     */
    private function getDefaultMatches(): array
    {
        $now = (int) (microtime(true) * 1000);
        return [
            [
                'id' => 'live-match-1',
                'home' => ['id' => 'blackhawks', 'name' => 'Chicago Blackhawks', 'score' => 5, 'shots' => 32],
                'away' => ['id' => 'penguins', 'name' => 'Pittsburgh Penguins', 'score' => 3, 'shots' => 28],
                'period' => 'FT',
                'periodScores' => [
                    'p1' => ['home' => 2, 'away' => 1],
                    'p2' => ['home' => 1, 'away' => 1],
                    'p3' => ['home' => 2, 'away' => 1],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'United Center',
                'date' => 'Wed, Oct 14, 2026',
                'dateTime' => 'Wed, Oct 14, 2026 05:30',
                'referee' => 'Furlatt E.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'FT',
                'statusBadge' => 'FT',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-jets-wild',
                'home' => ['id' => 'jets', 'name' => 'Winnipeg Jets', 'score' => 5, 'shots' => 30],
                'away' => ['id' => 'wild', 'name' => 'Minnesota Wild', 'score' => 2, 'shots' => 22],
                'period' => 'FT',
                'periodScores' => [
                    'p1' => ['home' => 2, 'away' => 0],
                    'p2' => ['home' => 2, 'away' => 1],
                    'p3' => ['home' => 1, 'away' => 1],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'Canada Life Centre',
                'date' => 'Wed, Oct 14, 2026',
                'dateTime' => 'Wed, Oct 14, 2026 05:00',
                'referee' => 'Roach J.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'FT',
                'statusBadge' => 'FT',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-stars-avs',
                'home' => ['id' => 'stars', 'name' => 'Dallas Stars', 'score' => 2, 'shots' => 26],
                'away' => ['id' => 'avalanche', 'name' => 'Colorado Avalanche', 'score' => 3, 'shots' => 35],
                'period' => 'FT',
                'periodScores' => [
                    'p1' => ['home' => 1, 'away' => 1],
                    'p2' => ['home' => 0, 'away' => 1],
                    'p3' => ['home' => 1, 'away' => 1],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'American Airlines Center',
                'date' => 'Wed, Oct 14, 2026',
                'dateTime' => 'Wed, Oct 14, 2026 06:30',
                'referee' => 'McCauley W.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'FT',
                'statusBadge' => 'FT',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-preds-knights',
                'home' => ['id' => 'predators', 'name' => 'Nashville Predators', 'score' => 2, 'shots' => 24],
                'away' => ['id' => 'knights', 'name' => 'Vegas Golden Knights', 'score' => 5, 'shots' => 38],
                'period' => 'FT',
                'periodScores' => [
                    'p1' => ['home' => 0, 'away' => 2],
                    'p2' => ['home' => 1, 'away' => 2],
                    'p3' => ['home' => 1, 'away' => 1],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'Bridgestone Arena',
                'date' => 'Wed, Oct 14, 2026',
                'dateTime' => 'Wed, Oct 14, 2026 07:00',
                'referee' => 'Sutherland K.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'FT',
                'statusBadge' => 'FT',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-mammoth-leafs',
                'home' => ['id' => 'mammoth', 'name' => 'Utah Mammoth', 'score' => 5, 'shots' => 31],
                'away' => ['id' => 'mapleleafs', 'name' => 'Toronto Maple Leafs', 'score' => 4, 'shots' => 29],
                'period' => 'FT',
                'periodScores' => [
                    'p1' => ['home' => 2, 'away' => 1],
                    'p2' => ['home' => 2, 'away' => 2],
                    'p3' => ['home' => 1, 'away' => 1],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'Delta Center',
                'date' => 'Wed, Oct 14, 2026',
                'dateTime' => 'Wed, Oct 14, 2026 08:00',
                'referee' => 'Lee C.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'FT',
                'statusBadge' => 'FT',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-oilers-flames',
                'home' => ['id' => 'oilers', 'name' => 'Edmonton Oilers', 'score' => 0, 'shots' => 0],
                'away' => ['id' => 'flames', 'name' => 'Calgary Flames', 'score' => 0, 'shots' => 0],
                'period' => 'UPCOMING',
                'periodScores' => [
                    'p1' => ['home' => 0, 'away' => 0],
                    'p2' => ['home' => 0, 'away' => 0],
                    'p3' => ['home' => 0, 'away' => 0],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'Rogers Place',
                'date' => 'Thu, Oct 15, 2026',
                'dateTime' => 'Thu, Oct 15, 2026 19:00',
                'referee' => 'Rank G.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'Upcoming',
                'statusBadge' => '19:00',
                'lastUpdatedAt' => $now
            ],
            [
                'id' => 'match-bruins-habs',
                'home' => ['id' => 'bruins', 'name' => 'Boston Bruins', 'score' => 0, 'shots' => 0],
                'away' => ['id' => 'canadiens', 'name' => 'Montreal Canadiens', 'score' => 0, 'shots' => 0],
                'period' => 'UPCOMING',
                'periodScores' => [
                    'p1' => ['home' => 0, 'away' => 0],
                    'p2' => ['home' => 0, 'away' => 0],
                    'p3' => ['home' => 0, 'away' => 0],
                    'ot' => ['home' => 0, 'away' => 0],
                ],
                'clock' => ['running' => false, 'remainingSeconds' => 1200, 'defaultPeriodSeconds' => 1200, 'lastUpdatedAt' => $now],
                'venue' => 'TD Garden',
                'date' => 'Thu, Oct 15, 2026',
                'dateTime' => 'Thu, Oct 15, 2026 19:30',
                'referee' => 'St. Laurent F.',
                'league' => 'NHL',
                'country' => 'USA',
                'status' => 'Upcoming',
                'statusBadge' => '19:30',
                'lastUpdatedAt' => $now
            ]
        ];
    }

    /**
     * Retrieve matches list from cache or disk backup.
     */
    public function getMatchesList(): array
    {
        $matches = Cache::get(self::MATCHES_CACHE_KEY);

        if (!$matches) {
            if (Storage::disk('local')->exists(self::MATCHES_FILE_BACKUP)) {
                $content = Storage::disk('local')->get(self::MATCHES_FILE_BACKUP);
                $matches = json_decode($content, true);
            }
        }

        if (!$matches || !is_array($matches)) {
            $matches = $this->getDefaultMatches();
            $this->saveMatchesList($matches);
        }

        return $matches;
    }

    /**
     * Persist matches list to cache and disk.
     */
    private function saveMatchesList(array $matches): void
    {
        Cache::forever(self::MATCHES_CACHE_KEY, $matches);
        Storage::disk('local')->put(self::MATCHES_FILE_BACKUP, json_encode($matches, JSON_PRETTY_PRINT));
    }

    /**
     * Get current active scoreboard state.
     */
    public function getState(): JsonResponse
    {
        $state = Cache::get(self::CACHE_KEY);

        if (!$state) {
            // Check file backup
            if (Storage::disk('local')->exists(self::FILE_BACKUP)) {
                $content = Storage::disk('local')->get(self::FILE_BACKUP);
                $state = json_decode($content, true);
            }
        }

        $matches = $this->getMatchesList();

        if (!$state) {
            // Default to first match in list
            $state = $matches[0] ?? $this->getDefaultMatches()[0];
            Cache::forever(self::CACHE_KEY, $state);
            Storage::disk('local')->put(self::FILE_BACKUP, json_encode($state, JSON_PRETTY_PRINT));
        }

        return response()->json([
            'status' => 'success',
            'data' => $state,
            'matches' => $matches,
            'timestamp' => $state['lastUpdatedAt'] ?? (int) (microtime(true) * 1000)
        ]);
    }

    /**
     * Update active scoreboard state (called when admin applies changes).
     */
    public function updateState(Request $request): JsonResponse
    {
        $newState = $request->all();
        $newState['lastUpdatedAt'] = (int) (microtime(true) * 1000);

        // Save active state to cache and persistent local disk
        Cache::forever(self::CACHE_KEY, $newState);
        Storage::disk('local')->put(self::FILE_BACKUP, json_encode($newState, JSON_PRETTY_PRINT));

        // If client provided a full matches array, save it
        if ($request->has('matches') && is_array($request->input('matches'))) {
            $matches = $request->input('matches');
            $this->saveMatchesList($matches);
        } else {
            // Automatically update active match within matches list
            $matches = $this->getMatchesList();
            $found = false;
            foreach ($matches as $idx => $m) {
                if (isset($m['id']) && isset($newState['id']) && $m['id'] === $newState['id']) {
                    $matches[$idx] = array_merge($m, $newState);
                    $found = true;
                    break;
                }
            }
            if (!$found && isset($newState['id'])) {
                $matches[] = $newState;
            }
            $this->saveMatchesList($matches);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Match state updated successfully for all connected clients.',
            'data' => $newState,
            'matches' => $matches,
            'timestamp' => $newState['lastUpdatedAt']
        ]);
    }

    /**
     * API: Get all matches list.
     */
    public function getMatches(): JsonResponse
    {
        $matches = $this->getMatchesList();
        return response()->json([
            'status' => 'success',
            'data' => $matches,
            'timestamp' => (int) (microtime(true) * 1000)
        ]);
    }

    /**
     * API: Add a new match (from Remote Control).
     */
    public function addMatch(Request $request): JsonResponse
    {
        $now = (int) (microtime(true) * 1000);
        $newMatch = $request->all();

        if (empty($newMatch['id'])) {
            $newMatch['id'] = 'match-' . uniqid();
        }

        $homeInput = is_array($request->input('home')) ? $request->input('home') : [];
        $awayInput = is_array($request->input('away')) ? $request->input('away') : [];

        $newMatch['home'] = array_merge([
            'id' => 'custom-home',
            'name' => 'Home Team',
            'score' => 0,
            'shots' => 0
        ], $homeInput);

        $newMatch['away'] = array_merge([
            'id' => 'custom-away',
            'name' => 'Away Team',
            'score' => 0,
            'shots' => 0
        ], $awayInput);

        $newMatch['period'] = $newMatch['period'] ?? '1';
        $newMatch['periodScores'] = $newMatch['periodScores'] ?? [
            'p1' => ['home' => 0, 'away' => 0],
            'p2' => ['home' => 0, 'away' => 0],
            'p3' => ['home' => 0, 'away' => 0],
            'ot' => ['home' => 0, 'away' => 0],
        ];

        $newMatch['clock'] = array_merge([
            'running' => false,
            'remainingSeconds' => 1200,
            'defaultPeriodSeconds' => 1200,
            'lastUpdatedAt' => $now
        ], $newMatch['clock'] ?? []);

        $newMatch['venue'] = $newMatch['venue'] ?? 'Arena Stadium';
        $newMatch['date'] = $newMatch['date'] ?? 'Wed, Oct 14, 2026';
        $newMatch['dateTime'] = $newMatch['dateTime'] ?? ($newMatch['date'] . ' 19:00');
        $newMatch['referee'] = $newMatch['referee'] ?? 'Official';
        $newMatch['league'] = $newMatch['league'] ?? 'NHL';
        $newMatch['country'] = $newMatch['country'] ?? 'USA';
        $newMatch['status'] = $newMatch['status'] ?? ($newMatch['period'] === 'FT' ? 'Finished' : 'Live');
        $newMatch['statusBadge'] = $newMatch['statusBadge'] ?? ($newMatch['period'] === 'FT' ? 'FT' : 'P1');
        $newMatch['lastUpdatedAt'] = $now;

        $matches = $this->getMatchesList();
        // Prepend so the newly added match is prominently at the top
        array_unshift($matches, $newMatch);
        $this->saveMatchesList($matches);

        // Also update active match
        Cache::forever(self::CACHE_KEY, $newMatch);
        Storage::disk('local')->put(self::FILE_BACKUP, json_encode($newMatch, JSON_PRETTY_PRINT));

        return response()->json([
            'status' => 'success',
            'message' => 'New match added successfully.',
            'data' => $newMatch,
            'matches' => $matches,
            'timestamp' => $now
        ], 201);
    }

    /**
     * API: Delete a match by ID (from Remote Control).
     */
    public function deleteMatch(string $id): JsonResponse
    {
        $now = (int) (microtime(true) * 1000);
        $matches = $this->getMatchesList();

        $originalCount = count($matches);
        $matches = array_values(array_filter($matches, function ($m) use ($id) {
            return ($m['id'] ?? '') !== $id;
        }));

        if (count($matches) === $originalCount) {
            return response()->json([
                'status' => 'error',
                'message' => 'Match not found.',
            ], 404);
        }

        // If all matches were deleted, create a fallback default match
        if (empty($matches)) {
            $matches = $this->getDefaultMatches();
        }

        $this->saveMatchesList($matches);

        // If the active match was deleted, set active match to the first remaining match
        $currentActive = Cache::get(self::CACHE_KEY);
        if ($currentActive && isset($currentActive['id']) && $currentActive['id'] === $id) {
            $newActive = $matches[0];
            $newActive['lastUpdatedAt'] = $now;
            Cache::forever(self::CACHE_KEY, $newActive);
            Storage::disk('local')->put(self::FILE_BACKUP, json_encode($newActive, JSON_PRETTY_PRINT));
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Match deleted successfully.',
            'deletedId' => $id,
            'matches' => $matches,
            'timestamp' => $now
        ]);
    }

    /**
     * Reset active game to default.
     */
    public function resetGame(): JsonResponse
    {
        $matches = $this->getDefaultMatches();
        $defaultState = $matches[0];
        $this->saveMatchesList($matches);

        Cache::forever(self::CACHE_KEY, $defaultState);
        Storage::disk('local')->put(self::FILE_BACKUP, json_encode($defaultState, JSON_PRETTY_PRINT));

        return response()->json([
            'status' => 'success',
            'message' => 'Scoreboard reset to default across all views.',
            'data' => $defaultState,
            'matches' => $matches
        ]);
    }
}
