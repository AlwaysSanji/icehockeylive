<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| NHL Scoreboard Authentication & API Routes
|--------------------------------------------------------------------------
*/

Route::get('/status', function () {
    return response()->json([
        'backend' => 'Laravel ' . app()->version(),
        'security' => [
            'password_hashing' => 'Bcrypt / Argon2id (Hash::make)',
            'rate_limiting' => 'Active (throttle:10,1 + Controller Throttling)',
            'sessions' => 'Encrypted HTTP-only cookies (laravel_session, XSRF-TOKEN)',
            'sanctum_stateful' => true,
        ],
        'status' => 'healthy',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Authentication routes protected with route-level throttle and controller rate-limiting
Route::middleware(['throttle:15,1'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/me', [AuthController::class, 'me']);
Route::post('/logout', [AuthController::class, 'logout']);

// Scoreboard Real-Time State Sync for All Users
Route::get('/scoreboard', [\App\Http\Controllers\ScoreboardController::class, 'getState']);
Route::post('/scoreboard', [\App\Http\Controllers\ScoreboardController::class, 'updateState']);
Route::post('/scoreboard/reset', [\App\Http\Controllers\ScoreboardController::class, 'resetGame']);

// Match Management Routes (Add Match & Delete Match from Remote Control)
Route::get('/matches', [\App\Http\Controllers\ScoreboardController::class, 'getMatches']);
Route::post('/matches', [\App\Http\Controllers\ScoreboardController::class, 'addMatch']);
Route::delete('/matches/{id}', [\App\Http\Controllers\ScoreboardController::class, 'deleteMatch']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
