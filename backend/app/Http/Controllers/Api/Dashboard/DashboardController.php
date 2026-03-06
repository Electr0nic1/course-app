<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SelfControl;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->title ?? null;

        $result = [
            'role' => $role,
        ];

        if ($role === 'athlete') {
            $athlete = $user->athlete;

            if (!$athlete) {
                return response()->json([
                    'message' => 'Athlete profile not found',
                ], 404);
            }

            $trainings = $athlete->trainings()
                ->select('trainings.id', 'trainings.date', 'trainings.duration_minutes', 'trainings.description')
                ->withPivot('status')
                ->orderBy('trainings.date')
                ->get();

            $nearest = $trainings->first(function ($t) {
                return ($t->pivot?->status ?? null) === 'planned';
            });

            $counts = [
                'total' => $trainings->count(),
                'planned' => $trainings->where('pivot.status', 'planned')->count(),
                'done' => $trainings->where('pivot.status', 'done')->count(),
                'canceled' => $trainings->where('pivot.status', 'canceled')->count(),
            ];

            $nearestDto = null;
            if ($nearest) {
                $nearestDto = [
                    'id' => $nearest->id,
                    'date' => $nearest->date,
                    'duration_minutes' => $nearest->duration_minutes,
                    'description' => $nearest->description,
                    'status' => $nearest->pivot->status,
                ];
            }

            $selfControls = SelfControl::query()
                ->where('athlete_id', $athlete->user_id)
                ->orderByDesc('date')
                ->limit(30)
                ->get(['date','heart_rate','body_weight','systolic_pressure','diastolic_pressure']);

            $result['trainings'] = [
                'counts' => $counts,
                'nearest' => $nearestDto,
            ];
            $result['self_controls'] = $selfControls;

            return response()->json($result);
        }

        if ($role === 'coach') {
            $plannedAssignmentsCount = DB::table('athlete_training')
                ->join('trainings', 'trainings.id', '=', 'athlete_training.training_id')
                ->where('trainings.coach_id', $user->id)
                ->whereBetween('trainings.date', [now(), now()->addDays(7)])
                ->where('athlete_training.status', 'planned')
                ->count();

            $result['coach'] = [
                'planned_next_7_days' => $plannedAssignmentsCount,
            ];

            return response()->json($result);
        }

        if ($role === 'admin') {
            $result['admin'] = [];
            return response()->json($result);
        }

        return response()->json($result);
    }
}