<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Training;

class TrainingStatusController extends Controller
{
    public function update(Request $request, int $id)
    {
        $request->validate([
            'status' => ['required', 'in:planned,done,canceled'],
        ]);

        $user = $request->user();
        $training = Training::query()->findOrFail($id);

        $role = $user->role?->title ?? null;

        if ($role === 'athlete') {
            if ((int)$training->athlete_id !== (int)$user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif (!in_array($role, ['coach', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $training->status = $request->string('status');
        $training->save();

        return response()->json(['message' => 'OK', 'training' => $training]);
    }
}
