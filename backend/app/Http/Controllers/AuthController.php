<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle user registration with hashed password, rate limiting, and session.
     */
    public function register(Request $request): JsonResponse
    {
        // 1. Rate Limiting (5 registration requests per minute per IP)
        $regThrottleKey = 'register|' . $request->ip();
        if (RateLimiter::tooManyAttempts($regThrottleKey, 5)) {
            $seconds = RateLimiter::availableIn($regThrottleKey);
            return response()->json([
                'status' => 'error',
                'message' => "Too many registration attempts. Please wait {$seconds} seconds.",
                'retry_after' => $seconds,
            ], 429);
        }

        // 2. Validation
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:4'],
        ]);

        if ($validator->fails()) {
            RateLimiter::hit($regThrottleKey, 60);
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        // Derive username if not provided
        $username = $request->filled('username')
            ? Str::lower($request->input('username'))
            : Str::lower(explode('@', $request->input('email'))[0]);

        // 3. Password Hashing with Bcrypt / Argon2id via Hash::make()
        $hashedPassword = Hash::make($request->input('password'));

        $user = User::create([
            'name' => $request->input('name'),
            'username' => $username,
            'email' => Str::lower($request->input('email')),
            'password' => $hashedPassword,
        ]);

        // 4. Session & Cookie Authentication
        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Generate Sanctum token
        $token = $user->createToken('web-session')->plainTextToken;

        $isInitialAdmin = Str::lower($user->username) === 'admin';
        $isInitialOperator = Str::lower($user->username) === 'operator';
        $role = $isInitialAdmin ? 'admin' : ($isInitialOperator ? 'operator' : 'viewer');
        $canControlRemote = $isInitialAdmin || $isInitialOperator;

        return response()->json([
            'status' => 'success',
            'message' => 'Account created successfully with encrypted session.',
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $role,
                'canControlRemote' => $canControlRemote,
            ],
            'token' => $token,
        ], 201);
    }

    /**
     * Handle user login with rate limiting, password hash verification, and session cookies.
     */
    public function login(Request $request): JsonResponse
    {
        $identifier = trim((string) ($request->input('identifier') ?? $request->input('email') ?? ''));
        $password = (string) $request->input('password');

        if (empty($identifier) || empty($password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide your email/username and password.',
            ], 422);
        }

        // 1. Rate Limiting Protection (5 failed attempts per minute)
        $throttleKey = Str::transliterate(Str::lower($identifier) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'status' => 'error',
                'message' => "Too many failed login attempts. Account temporarily locked for {$seconds} seconds.",
                'retry_after' => $seconds,
            ], 429);
        }

        // 2. Locate User by Email or Username
        $user = User::where('email', Str::lower($identifier))
            ->orWhere('username', Str::lower($identifier))
            ->first();

        // 3. Verify Password Hash using Hash::check()
        if (!$user || !Hash::check($password, $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            $remaining = RateLimiter::remaining($throttleKey, 5);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email/username or password.',
                'remaining_attempts' => $remaining,
            ], 401);
        }

        // Reset rate limiter on successful authentication
        RateLimiter::clear($throttleKey);

        // 4. Session & Cookie Management
        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Issue Sanctum token for flexible API usage
        $token = $user->createToken('web-session')->plainTextToken;

        $isInitialAdmin = Str::lower($user->username) === 'admin';
        $isInitialOperator = Str::lower($user->username) === 'operator';
        $role = $isInitialAdmin ? 'admin' : ($isInitialOperator ? 'operator' : 'viewer');
        $canControlRemote = $isInitialAdmin || $isInitialOperator;

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful. Session authenticated.',
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $role,
                'canControlRemote' => $canControlRemote,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Get current authenticated user details from session or token.
     */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'unauthenticated',
                'message' => 'No active session found.',
                'user' => null,
            ], 401);
        }

        $isInitialAdmin = Str::lower($user->username) === 'admin';
        $isInitialOperator = Str::lower($user->username) === 'operator';
        $role = $isInitialAdmin ? 'admin' : ($isInitialOperator ? 'operator' : 'viewer');
        $canControlRemote = $isInitialAdmin || $isInitialOperator;

        return response()->json([
            'status' => 'authenticated',
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $role,
                'canControlRemote' => $canControlRemote,
            ],
        ]);
    }

    /**
     * Logout user and invalidate session & cookies.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();

        if ($user && method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully. Session invalidated.',
        ]);
    }
}
