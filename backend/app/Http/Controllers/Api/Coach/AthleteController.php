<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\Athlete;
use App\Models\SelfControl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AthleteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coach = $request->user()->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        $items = Athlete::query()
            // athletes.coach_id хранит coaches.user_id
            ->where('coach_id', $coach->user_id)
            ->with('user')
            ->orderBy('user_id')
            ->paginate(20);

        return response()->json($items);
    }

    public function show(Request $request, Athlete $athlete): JsonResponse
    {
        $coach = $request->user()->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        if ((int)$athlete->coach_id !== (int)$coach->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($athlete->load(['user', 'coach.user']));
    }

    public function selfControls(Request $request, Athlete $athlete): JsonResponse
    {
        $coach = $request->user()->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        if ((int)$athlete->coach_id !== (int)$coach->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $items = SelfControl::query()
            // self_controls.athlete_id хранит athletes.user_id
            ->where('athlete_id', $athlete->user_id)
            ->orderByDesc('date')
            ->paginate(20);

        return response()->json($items);
    }
}