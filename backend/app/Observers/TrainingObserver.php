<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Training;
use Illuminate\Support\Facades\Auth;

class TrainingObserver
{
    public function created(Training $training): void
    {
        ActivityLog::create([
            'actor_user_id' => Auth::id(),
            'entity_type' => 'training',
            'entity_id' => $training->id,
            'action' => 'created',
            'meta' => [
                'status' => $training->status,
                'date' => $training->date,
            ],
        ]);
    }

    public function updated(Training $training): void
    {
        $dirty = $training->getDirty();

        if (array_key_exists('status', $dirty)) {
            ActivityLog::create([
                'actor_user_id' => Auth::id(),
                'entity_type' => 'training',
                'entity_id' => $training->id,
                'action' => 'status_changed',
                'meta' => [
                    'from' => $training->getOriginal('status'),
                    'to' => $training->status,
                ],
            ]);
            return;
        }

        ActivityLog::create([
            'actor_user_id' => Auth::id(),
            'entity_type' => 'training',
            'entity_id' => $training->id,
            'action' => 'updated',
            'meta' => [
                'fields' => array_keys($dirty),
            ],
        ]);
    }

    public function deleted(Training $training): void
    {
        ActivityLog::create([
            'actor_user_id' => Auth::id(),
            'entity_type' => 'training',
            'entity_id' => $training->id,
            'action' => 'deleted',
            'meta' => null,
        ]);
    }
}
