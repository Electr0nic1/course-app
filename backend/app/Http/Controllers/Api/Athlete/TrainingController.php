<?php

namespace App\Http\Controllers\Api\Athlete;

use App\Http\Controllers\Controller;
use App\Models\Training;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // athlete profile is a subtype (athletes.user_id = users.id)
        if (!$user?->athlete) {
            return response()->json(['message' => 'Athlete profile not found'], 404);
        }

        $athleteUserId = (int) $user->id;

        // Надёжная фильтрация через pivot athlete_training (athlete_id хранит athletes.user_id)
        $items = Training::query()
            ->whereHas('athletes', function ($q) use ($athleteUserId) {
                $q->where('athletes.user_id', $athleteUserId);
            })
            ->with([
                'trainingType',
                'coach.user',
            ])
            ->orderByDesc('date')
            ->paginate(20);

        return response()->json($items);
    }

    public function show(Request $request, Training $training): JsonResponse
    {
        $this->authorize('view', $training);

        // Для athlete полезно вернуть статус из pivot (assigned/completed/skipped)
        $user = $request->user();
        $athleteUserId = (int) $user->id;

        $training->load([
            'trainingType',
            'coach.user',
            // оставляем только текущего спортсмена в athletes, чтобы не светить остальных
            'athletes' => function ($q) use ($athleteUserId) {
                $q->where('athletes.user_id', $athleteUserId);
            },
        ]);

        return response()->json($training);
    }
}