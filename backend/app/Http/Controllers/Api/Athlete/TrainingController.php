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

        if (!$user?->athlete) {
            return response()->json(['message' => 'Athlete profile not found'], 404);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $athleteUserId = (int) $user->id;

        $items = Training::query()
            ->whereHas('athletes', function ($q) use ($athleteUserId) {
                $q->where('athletes.user_id', $athleteUserId);
            })
            ->when($validated['from'] ?? null, fn($q, $from) => $q->whereDate('date', '>=', $from))
            ->when($validated['to']   ?? null, fn($q, $to)   => $q->whereDate('date', '<=', $to))
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

        $user = $request->user();
        $athleteUserId = (int) $user->id;

        $training->load([
            'trainingType',
            'coach.user',
            'athletes' => function ($q) use ($athleteUserId) {
                $q->where('athletes.user_id', $athleteUserId);
            },
        ]);

        return response()->json($training);
    }
}
