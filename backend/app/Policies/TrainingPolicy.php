<?php

namespace App\Policies;

use App\Models\Training;
use App\Models\User;

class TrainingPolicy
{
    public function viewAny(User $user): bool
    {
        $role = $user->role?->title;

        return in_array($role, ['athlete', 'coach', 'admin'], true);
    }

    public function view(User $user, Training $training): bool
    {
        return $this->canAccess($user, $training);
    }

    public function create(User $user): bool
    {
        $role = $user->role?->title;

        return in_array($role, ['coach', 'admin'], true);
    }

    public function update(User $user, Training $training): bool
    {
        $role = $user->role?->title;

        if ($role === 'coach') {
            return (int)$training->coach_id === (int)($user->coach?->user_id ?? 0);
        }

        if ($role === 'admin') {
            return true;
        }

        return false;
    }

    public function delete(User $user, Training $training): bool
    {
        return $this->update($user, $training);
    }

    private function canAccess(User $user, Training $training): bool
    {
        $role = $user->role?->title;

        if ($role === 'admin') {
            return true;
        }

        if ($role === 'coach') {
            return (int)$training->coach_id === (int)($user->coach?->user_id ?? 0);
        }

        if ($role === 'athlete') {
            $athleteUserId = (int) $user->id;

            return $training->athletes()
                ->where('athletes.user_id', $athleteUserId)
                ->exists();
        }

        return false;
    }
}