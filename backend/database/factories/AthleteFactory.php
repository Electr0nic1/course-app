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
        return [
            'initial_weight' => fake()->randomFloat(1, 50, 110),
            'height' => fake()->randomFloat(1, 155, 205),
        ];
    }
}