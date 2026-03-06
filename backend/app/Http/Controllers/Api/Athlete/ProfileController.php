<?php

namespace App\Http\Controllers\Api\Athlete;

use App\Http\Controllers\Controller;
use App\Http\Requests\Athlete\StoreAthleteProfileRequest;
use App\Http\Requests\Athlete\UpdateAthleteProfileRequest;
use App\Models\Athlete;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $athlete = $request->user()?->athlete;

        return response()->json([
            'athlete' => $athlete,
        ]);
    }

    // Создание профиля при первом входе
    public function store(StoreAthleteProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        // защита от повторного создания
        if ($user->athlete) {
            return response()->json([
                'message' => 'Athlete profile already exists',
                'athlete' => $user->athlete,
            ], 409);
        }

        $data = $request->validated();

        $athlete = Athlete::create([
            'user_id' => $user->id,
            'coach_id' => $data['coach_id'] ?? null,
            'initial_weight' => $data['initial_weight'],
            'height' => $data['height'],
        ]);

        return response()->json([
            'athlete' => $athlete->load('user', 'coach.user'),
        ], 201);
    }

    public function update(UpdateAthleteProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $athlete = $user->athlete;
        if (!$athlete) {
            return response()->json(['message' => 'Athlete profile not found'], 404);
        }

        $athlete->update($request->validated());

        return response()->json([
            'athlete' => $athlete->fresh()->load('user', 'coach.user'),
        ]);
    }
}