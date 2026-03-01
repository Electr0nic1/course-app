<?php

namespace Database\Factories;

use App\Models\Athlete;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Athlete>
 */
class AthleteFactory extends Factory
{
    protected $model = Athlete::class;

    public function definition(): array
    {
        // user_id и coach_id будем задавать вручную при создании
        return [
            'initial_weight' => fake()->randomFloat(1, 50, 110),
            'height' => fake()->randomFloat(1, 155, 205),
        ];
    }
}