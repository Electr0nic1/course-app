<?php

namespace Database\Factories;

use App\Models\Coach;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Coach>
 */
class CoachFactory extends Factory
{
    protected $model = Coach::class;

    public function definition(): array
    {
        // user_id будет задан вручную (потому что PK=user_id)
        return [
            'work_experience' => fake()->numberBetween(1, 25),
        ];
    }
}