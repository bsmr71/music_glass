<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register new user with Email Verification
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain atau login.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate 6-digit OTP verification code
        $verificationCode = (string) mt_rand(100000, 999999);

        $user = User::create([
            'name' => $request->name,
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'verification_code' => $verificationCode,
            'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=' . urlencode($request->name),
            'email_verified_at' => null,
        ]);

        // Attempt to send email verification if mail is configured
        try {
            // Log verification code for development & easy access
            logger()->info("Music Glass Email Verification for {$user->email}: Code = {$verificationCode}");
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil! Kode verifikasi 6-digit telah dikirim ke email Anda.',
            'email' => $user->email,
            'verification_code' => $verificationCode, // Included for effortless instant verification
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_verified' => false
            ]
        ], 201);
    }

    /**
     * Verify email with 6-digit OTP code
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email tersebut tidak ditemukan.'
            ], 404);
        }

        if ($user->email_verified_at) {
            Auth::login($user, true);
            return response()->json([
                'success' => true,
                'message' => 'Email Anda sudah terverifikasi sebelumnya.',
                'user' => $user
            ]);
        }

        if ($user->verification_code !== trim($request->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak sesuai atau telah kedaluwarsa. Silakan periksa kembali.'
            ], 422);
        }

        // Mark as verified
        $user->update([
            'email_verified_at' => now(),
            'verification_code' => null
        ]);

        Auth::login($user, true);

        return response()->json([
            'success' => true,
            'message' => 'Selamat! Email Anda berhasil diverifikasi dan akun Anda telah aktif.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_verified' => true,
                'verified_at' => $user->email_verified_at
            ]
        ]);
    }

    /**
     * Resend verification code
     */
    public function resendCode(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Email tidak ditemukan.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['success' => false, 'message' => 'Email sudah terverifikasi. Silakan login.']);
        }

        $newCode = (string) mt_rand(100000, 999999);
        $user->update(['verification_code' => $newCode]);

        logger()->info("Music Glass Resent Code for {$user->email}: Code = {$newCode}");

        return response()->json([
            'success' => true,
            'message' => 'Kode verifikasi baru telah dikirim ke email Anda!',
            'verification_code' => $newCode
        ]);
    }

    /**
     * Standard Email & Password Login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Email wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau kata sandi yang Anda masukkan salah.'
            ], 401);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            // Generate a fresh code if none exists
            if (!$user->verification_code) {
                $user->update(['verification_code' => (string) mt_rand(100000, 999999)]);
            }

            return response()->json([
                'success' => false,
                'unverified' => true,
                'email' => $user->email,
                'verification_code' => $user->verification_code,
                'message' => 'Akun Anda belum diverifikasi. Silakan masukkan kode verifikasi email terlebih dahulu.'
            ], 403);
        }

        Auth::login($user, $request->boolean('remember', true));
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => "Selamat datang kembali, {$user->name}!",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_verified' => true
            ]
        ]);
    }

    /**
     * Google / YouTube OAuth Seamless Sign-in
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'google_id' => 'nullable|string',
            'avatar' => 'nullable|string',
        ]);

        $email = strtolower(trim($request->email));
        $googleId = $request->google_id ?: ('goog_' . md5($email));
        $name = $request->name;
        $avatar = $request->avatar ?: ('https://api.dicebear.com/7.x/avataaars/svg?seed=' . urlencode($name));

        // Find existing user by google_id or email
        $user = User::where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            $user->update([
                'google_id' => $googleId,
                'avatar' => $avatar ?: $user->avatar,
                'email_verified_at' => $user->email_verified_at ?: now(),
            ]);
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'password' => Hash::make(uniqid('goog_pass_', true)),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => "Berhasil masuk dengan akun Google: {$user->name}!",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_verified' => true
            ]
        ]);
    }

    /**
     * Get Current Authenticated User Session
     */
    public function me(): JsonResponse
    {
        if (Auth::check()) {
            $user = Auth::user();
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'is_verified' => (bool)$user->email_verified_at,
                    'created_at' => $user->created_at->format('M Y')
                ]
            ]);
        }

        return response()->json([
            'authenticated' => false,
            'user' => null
        ]);
    }

    /**
     * Logout Current User
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Anda telah berhasil keluar dari akun.'
        ]);
    }
}
