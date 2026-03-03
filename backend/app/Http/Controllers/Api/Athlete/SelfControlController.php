<?php

namespace App\Http\Controllers\Api\Athlete;

use App\Http\Controllers\Controller;
use App\Http\Requests\Athlete\StoreSelfControlRequest;
use App\Http\Requests\Athlete\UpdateSelfControlRequest;
use App\Models\SelfControl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SelfControlController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $athlete = $request->user()->athlete;
        if (!$athlete) {
            return response()->json(['message' => 'Athlete profile not found'], 404);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $items = SelfControl::query()
            ->where('athlete_id', $athlete->user_id)
            ->when($validated['from'] ?? null, fn($q, $from) => $q->whereDate('date', '>=', $from))
            ->when($validated['to']   ?? null, fn($q, $to)   => $q->whereDate('date', '<=', $to))
            ->orderByDesc('date')
            ->paginate(20);

        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSelfControlRequest $request): JsonResponse
    {
        $athlete = $request->user()->athlete;
        if (!$athlete) {
            return response()->json(['message' => 'Athlete profile not found'], 404);
        }

        $data = $request->validated();
        $data['athlete_id'] = $athlete->user_id;

        $item = SelfControl::create($data);

        return response()->json($item, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SelfControl $self_control): JsonResponse
    {
        $this->authorize('view', $self_control);
        return response()->json($self_control);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSelfControlRequest $request, SelfControl $self_control): JsonResponse
    {
        $this->authorize('update', $self_control);

        $self_control->update($request->validated());

        return response()->json($self_control);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SelfControl $self_control): JsonResponse
    {
        $this->authorize('delete', $self_control);

        $self_control->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
