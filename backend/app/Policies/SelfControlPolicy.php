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

        // athlete → только свои записи
        if ($role === 'athlete') {
            // self_controls.athlete_id == athletes.user_id == users.id
            return (int)$selfControl->athlete_id === (int)$user->id;
        }

        // admin → всё
        if ($role === 'admin') {
            return true;
        }

        // coach → не редактирует дневник
        return false;
    }

    public function delete(User $user, SelfControl $selfControl): bool
    {
        return $this->update($user, $selfControl);
    }

    private function canView(User $user, SelfControl $selfControl): bool
    {
        $role = $user->role?->title;

        // athlete → только свои записи
        if ($role === 'athlete') {
            return (int)$selfControl->athlete_id === (int)$user->id;
        }

        // coach → записи своих спортсменов
        if ($role === 'coach') {
            $coachUserId = (int)($user->coach?->user_id ?? 0);
            if (!$coachUserId) {
                return false;
            }

            // self_controls.athlete_id хранит athletes.user_id
            return Athlete::query()
                ->where('user_id', $selfControl->athlete_id)
                ->where('coach_id', $coachUserId)
                ->exists();
        }

        // admin → всё
        if ($role === 'admin') {
            return true;
        }

        return false;
    }
}