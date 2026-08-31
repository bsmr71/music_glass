<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    /**
     * Create a new room for Listen Together
     */
    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'current_track' => 'nullable|array'
        ]);

        $code = strtoupper(Str::random(6));

        $room = Room::create([
            'code' => $code,
            'name' => $validated['name'] ?? 'Convx Lounge ' . $code,
            'current_track' => $validated['current_track'] ?? null,
            'is_playing' => true,
            'seek_time' => 0,
            'last_sync_at' => now()
        ]);

        return response()->json($room, 201);
    }

    /**
     * Get room state
     */
    public function get(string $code): JsonResponse
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();
        return response()->json($room);
    }

    /**
     * Sync room state
     */
    public function sync(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();

        $room->update([
            'current_track' => $request->input('current_track', $room->current_track),
            'is_playing' => $request->boolean('is_playing', $room->is_playing),
            'seek_time' => $request->float('seek_time', $room->seek_time),
            'last_sync_at' => now()
        ]);

        return response()->json($room);
    }
}
