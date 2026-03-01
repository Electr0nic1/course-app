<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\Coach\AssignTrainingRequest;
use App\Http\Requests\Coach\StoreTrainingRequest;
use App\Http\Requests\Coach\UpdateTrainingRequest;
use App\Models\Athlete;
use App\Models\Training;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coach = $request->user()->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        $items = Training::query()
            // trainings.coach_id -> coaches.user_id
            ->where('coach_id', $coach->user_id)
            ->with(['trainingType', 'athletes.user', 'coach.user'])
            ->orderByDesc('date')
            ->paginate(20);

        return response()->json($items);
    }

    public function store(StoreTrainingRequest $request): JsonResponse
    {
        $coach = $request->user()->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        $data = $request->validated();

        // trainings.coach_id -> coaches.user_id
        $data['coach_id'] = $coach->user_id;

        $data['status'] = $data['status'] ?? 'planned';

        $training = Training::create($data);

        return response()->json($training->load(['trainingType', 'coach.user']), 201);
    }

    public function show(Training $training): JsonResponse
    {
        $this->authorize('view', $training);

        return response()->json(
            $training->load(['trainingType', 'athletes.user', 'coach.user'])
        );
    }

    public function update(UpdateTrainingRequest $request, Training $training): JsonResponse
    {
        $this->authorize('update', $training);

        $training->update($request->validated());

        return response()->json($training->load(['trainingType', 'coach.user']));
    }

    public function destroy(Training $training): JsonResponse
    {
        $this->authorize('delete', $training);

        $training->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function assign(AssignTrainingRequest $request, Training $training): JsonResponse
    {
        $this->authorize('update', $training);

        $coachUserId = (int)($request->user()?->coach?->user_id ?? 0);
        if (!$coachUserId) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        $validated = $request->validated();
        $athleteIds = $validated['athlete_ids']; // ожидаем athletes.user_id
        $status = $validated['status'] ?? 'assigned';

        // Разрешаем назначать только своих спортсменов
        // athletes.user_id = id спортсмена (users.id)
        $allowedAthletes = Athlete::query()
            ->where('coach_id', $coachUserId)
            ->whereIn('user_id', $athleteIds)
            ->pluck('user_id')
            ->all();

        if (count($allowedAthletes) !== count(array_unique($athleteIds))) {
            return response()->json(['message' => 'Some athletes are not allowed for this coach'], 403);
        }

        // syncWithoutDetaching ожидает: [related_id => ['pivot_col' => value]]
        // related_id для Athlete = user_id (PK)
        $attachData = [];
        foreach ($allowedAthletes as $aid) {
            $attachData[$aid] = ['status' => $status];
        }

        $training->athletes()->syncWithoutDetaching($attachData);

        return response()->json([
            'message' => 'Assigned',
            'training' => $training->load(['athletes.user']),
        ]);
    }
}