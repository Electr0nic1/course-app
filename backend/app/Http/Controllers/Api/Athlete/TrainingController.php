<?php

namespace App\Http\Controllers\Api\Athlete;

use App\Http\Controllers\Controller;
use App\Models\Training;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\Athlete\UpdateAthleteTrainingStatusRequest;

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

    $athlete = $user->athlete;

    $query = $athlete->trainings()
        ->select(
            'trainings.id',
            'trainings.training_type_id',
            'trainings.coach_id',
            'trainings.date',
            'trainings.duration_minutes',
            'trainings.description',
            'trainings.status as training_status',
            'trainings.created_at',
            'trainings.updated_at'
        )
        ->withPivot('status')
        ->with([
            'trainingType',
            'coach.user',
        ])
        ->when($validated['from'] ?? null, fn($q, $from) => $q->whereDate('trainings.date', '>=', $from))
        ->when($validated['to'] ?? null, fn($q, $to) => $q->whereDate('trainings.date', '<=', $to))
        ->orderByDesc('trainings.date');

    $paginator = $query->paginate(20);

    $paginator->getCollection()->transform(function ($training) {
        return [
            'id' => $training->id,
            'training_type_id' => $training->training_type_id,
            'coach_id' => $training->coach_id,
            'date' => $training->date,
            'duration_minutes' => $training->duration_minutes,
            'description' => $training->description,

            'status' => $training->pivot?->status,

            'training_status' => $training->training_status,

            'training_type' => $training->trainingType,
            'coach' => $training->coach,
            'created_at' => $training->created_at,
            'updated_at' => $training->updated_at,
        ];
    });

    return response()->json($paginator);
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

    public function updateStatus(UpdateAthleteTrainingStatusRequest $request, int $trainingId): JsonResponse
    {
        $user = $request->user();
        $role = $user->role?->title ?? null;

        if ($role !== 'athlete') {
            return response()->json([
                'message' => 'Доступ запрещён.',
            ], 403);
        }

        $athlete = $user->athlete;

        if (!$athlete) {
            return response()->json([
                'message' => 'Профиль спортсмена не найден.',
            ], 404);
        }

        $training = $athlete->trainings()
            ->where('trainings.id', $trainingId)
            ->first();

        if (!$training) {
            return response()->json([
                'message' => 'Тренировка не найдена или не назначена данному спортсмену.',
            ], 404);
        }

        $newStatus = $request->validated()['status'];
        $currentStatus = $training->pivot->status;

        // Можно запретить менять уже завершённые/пропущенные записи обратно
        if (in_array($currentStatus, ['completed', 'skipped'], true) && $currentStatus !== $newStatus) {
            return response()->json([
                'message' => 'Статус этой тренировки уже зафиксирован и не может быть изменён.',
            ], 422);
        }

        $athlete->trainings()->updateExistingPivot($trainingId, [
            'status' => $newStatus,
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Статус участия в тренировке успешно обновлён.',
            'data' => [
                'training_id' => $trainingId,
                'athlete_id' => $athlete->user_id,
                'old_status' => $currentStatus,
                'new_status' => $newStatus,
            ],
        ]);
    }
}
