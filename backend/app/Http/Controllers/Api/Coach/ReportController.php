<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\Coach\ReportRequest;
use App\Models\Athlete;
use App\Models\SelfControl;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function index(ReportRequest $request): JsonResponse
    {
        $coach = $request->user()?->coach;
        if (!$coach) {
            return response()->json(['message' => 'Coach profile not found'], 404);
        }

        $data = $request->validated();

        $athlete = Athlete::query()
            ->with('user')
            ->whereKey($data['athlete_id'])
            ->firstOrFail();

        if ((int)$athlete->coach_id !== (int)$coach->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $from = $data['from'];
        $to = $data['to'];

        $q = SelfControl::query()
            ->where('athlete_id', $athlete->user_id)
            ->whereBetween('date', [$from, $to]);

        $stats = [
            'count' => (clone $q)->count(),
            'avg_heart_rate' => (float) (clone $q)->avg('heart_rate'),
            'avg_systolic_pressure' => (float) (clone $q)->avg('systolic_pressure'),
            'avg_diastolic_pressure' => (float) (clone $q)->avg('diastolic_pressure'),
            'avg_body_weight' => (float) (clone $q)->avg('body_weight'),
            'avg_feeling' => (float) (clone $q)->avg('feeling'),
        ];

        $series = (clone $q)
            ->orderBy('date')
            ->get([
                'date',
                'heart_rate',
                'systolic_pressure',
                'diastolic_pressure',
                'body_weight',
                'feeling',
            ]);

        return response()->json([
            'athlete' => [
                'id' => $athlete->user_id,
                'full_name' => $athlete->user?->full_name,
            ],
            'from' => $from,
            'to' => $to,
            'stats' => $stats,
            'series' => $series,
        ]);
    }
}