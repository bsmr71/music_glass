<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\MusicController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

// ==================== API ROUTES ====================
Route::prefix('api')->group(function () {
    // Authentication & Account
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-code', [AuthController::class, 'resendCode']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Music & Streaming
    Route::get('/music/search', [MusicController::class, 'search']);
    Route::get('/music/trending', [MusicController::class, 'trending']);
    Route::get('/music/stream/{id}', [MusicController::class, 'stream']);
    Route::get('/music/stream-raw/{id}', [MusicController::class, 'streamRaw']);
    Route::get('/music/lyrics', [MusicController::class, 'lyrics']);

    // Library & Playlists
    Route::get('/playlists', [LibraryController::class, 'getPlaylists']);
    Route::post('/playlists', [LibraryController::class, 'createPlaylist']);
    Route::get('/playlists/{id}', [LibraryController::class, 'getPlaylist']);
    Route::patch('/playlists/{id}', [LibraryController::class, 'updatePlaylist']);
    Route::delete('/playlists/{id}', [LibraryController::class, 'deletePlaylist']);
    Route::post('/playlists/{id}/tracks', [LibraryController::class, 'addTrackToPlaylist']);
    Route::delete('/playlists/{id}/tracks/{trackId}', [LibraryController::class, 'removeTrackFromPlaylist']);

    // Favorites
    Route::get('/favorites', [LibraryController::class, 'getFavorites']);
    Route::post('/favorites/toggle', [LibraryController::class, 'toggleFavorite']);

    // History
    Route::get('/history', [LibraryController::class, 'getHistory']);
    Route::post('/history', [LibraryController::class, 'addHistory']);
    Route::delete('/history', [LibraryController::class, 'clearHistory']);

    // Listen Together Rooms
    Route::post('/rooms', [RoomController::class, 'create']);
    Route::get('/rooms/{code}', [RoomController::class, 'get']);
    Route::post('/rooms/{code}/sync', [RoomController::class, 'sync']);
});

// ==================== SPA WEB ROUTES ====================
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
