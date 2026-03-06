<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->title;

        if ($role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'action' => ['nullable', 'string', 'max:100'],
            'entity_type' => ['nullable', 'string', 'max:100'],
            'entity_id' => ['nullable', 'integer'],
            'actor_user_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $q = ActivityLog::query();

        $q->with(['actor:id,full_name,email,role_id']);

        if (!empty($validated['action'])) {
            $q->where('action', $validated['action']);
        }

        if (!empty($validated['entity_type'])) {
            $q->where('entity_type', $validated['entity_type']);
        }

        if (!empty($validated['entity_id'])) {
            $q->where('entity_id', $validated['entity_id']);
        }

        if (!empty($validated['actor_user_id'])) {
            $q->where('actor_user_id', $validated['actor_user_id']);
        }

        if (!empty($validated['from'])) {
            $q->whereDate('created_at', '>=', $validated['from']);
        }

        if (!empty($validated['to'])) {
            $q->whereDate('created_at', '<=', $validated['to']);
        }

        if (!empty($validated['q'])) {
            $search = trim($validated['q']);

            $q->where(function ($sub) use ($search) {
                $sub->where('action', 'like', "%{$search}%")
                    ->orWhere('entity_type', 'like', "%{$search}%")
                    ->orWhere('entity_id', 'like', "%{$search}%")
                    ->orWhere('actor_user_id', 'like', "%{$search}%")
                    ->orWhere('meta', 'like', "%{$search}%");
            });
        }

        $q->orderByDesc('created_at')->orderByDesc('id');

        return response()->json(
            $q->paginate($perPage)
        );
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();
        $role = $user->role?->title;

        if ($role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $log = ActivityLog::query()
            ->with(['actor:id,full_name,email,role_id'])
            ->findOrFail($id);

        return response()->json($log);
    }
}