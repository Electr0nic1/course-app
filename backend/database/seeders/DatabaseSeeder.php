<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\Coach;
use App\Models\SelfControl;
use App\Models\Training;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            TrainingTypeSeeder::class,
        ]);

        $admin = User::factory()->role('admin')->create([
            'email' => 'admin@test.com',
            'full_name' => 'Admin User',
            'password' => Hash::make('password'),
        ]);

        $coachUsers = User::factory()
            ->count(3)
            ->role('coach')
            ->create();

        $coaches = $coachUsers->map(function (User $u) {
            return Coach::factory()->create([
                'user_id' => $u->id, // PK=user_id
            ]);
        });

        $athleteUsers = User::factory()
            ->count(12)
            ->role('athlete')
            ->create();

        $athletes = $athleteUsers->map(function (User $u) use ($coaches) {
            $coach = $coaches->random();

            return Athlete::factory()->create([
                'user_id' => $u->id,         
                'coach_id' => $coach->user_id, 
            ]);
        });

        $trainings = collect();
        foreach ($coaches as $coach) {
            $trainings = $trainings->merge(
                Training::factory()->count(8)->create([
                    'coach_id' => $coach->user_id, 
                ])
            );
        }

        foreach ($trainings as $training) {
            $pick = $athletes->random(rand(3, 6));

            $attach = [];
            foreach ($pick as $ath) {
                $attach[$ath->user_id] = ['status' => 'assigned'];
            }

            $training->athletes()->attach($attach);
        }

        foreach ($athletes as $athlete) {
            SelfControl::factory()->count(10)->create([
                'athlete_id' => $athlete->user_id,
            ]);
        }
    }
}