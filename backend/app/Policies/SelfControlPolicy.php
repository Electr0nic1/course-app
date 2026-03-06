<?php

namespace App\Policies;

use App\Models\Athlete;
use App\Models\SelfControl;
use App\Models\User;

class SelfControlPolicy
{
    public function viewAny(User $user): bool
    {
        $role = $user->role?->title;

        return in_array($role, ['athlete', 'coach', 'admin'], true);
    }

    public function view(User $user, SelfControl $selfControl): bool
    {
        return $this->canView($user, $selfControl);
    }

    public function create(User $user): bool
    {
        return $user->role?->title === 'athlete';
    }

    public function update(User $user, SelfControl $selfControl): bool
    {
        $role = $user->role?->title;

        if ($role === 'athlete') {
            return (int)$selfControl->athlete_id === (int)$user->id;
        }

        if ($role === 'admin') {
            return true;
        }

        return false;
    }

    public function delete(User $user, SelfControl $selfControl): bool
    {
        return $this->update($user, $selfControl);
    }

    private function canView(User $user, SelfControl $selfControl): bool
    {
        $role = $user->role?->title;

        if ($role === 'athlete') {
            return (int)$selfControl->athlete_id === (int)$user->id;
        }

        if ($role === 'coach') {
            $coachUserId = (int)($user->coach?->user_id ?? 0);
            if (!$coachUserId) {
                return false;
            }

            return Athlete::query()
                ->where('user_id', $selfControl->athlete_id)
                ->where('coach_id', $coachUserId)
                ->exists();
        }

        if ($role === 'admin') {
            return true;
        }

        return false;
    }
}