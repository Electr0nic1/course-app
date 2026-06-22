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

        User::factory()->role('admin')->create([
            'email' => 'admin@test.com',
            'full_name' => 'Admin User',
            'password' => Hash::make('password'),
        ]);

        $coachUsers = User::factory()
            ->count(50)
            ->role('coach')
            ->create();

        $coaches = $coachUsers->map(
            fn(User $u) =>
            Coach::factory()->create([
                'user_id' => $u->id,
            ])
        );

        $athletes = collect();

        $athleteUsers = User::factory()
            ->count(50)
            ->role('athlete')
            ->create();

        $athleteUsers->each(function (User $u, $index) use ($coaches, &$athletes) {

            $coach = $coaches[$index % $coaches->count()];

            $athletes->push(
                Athlete::factory()->create([
                    'user_id' => $u->id,
                    'coach_id' => $coach->user_id,
                ])
            );
        });

        $coaches->each(function ($coach) use ($athletes) {

            $coachAthletes = $athletes->where('coach_id', $coach->user_id)->values();

            $trainings = Training::factory()
                ->count(10)
                ->create([
                    'coach_id' => $coach->user_id,
                ]);

            foreach ($trainings as $training) {

                $count = min(rand(3, 6), $coachAthletes->count());

                $pick = $coachAthletes->random($count);

                $attach = [];

                foreach ($pick as $ath) {
                    $attach[$ath->user_id] = ['status' => 'assigned'];
                }

                $training->athletes()->attach($attach);
            }
        });

        $athletes->each(function ($athlete) {
            SelfControl::factory()
                ->count(10)
                ->create([
                    'athlete_id' => $athlete->user_id,
                ]);
        });
    }
}
