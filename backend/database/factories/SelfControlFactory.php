<?php

namespace Database\Factories;

use App\Models\SelfControl;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SelfControl>
 */
class SelfControlFactory extends Factory
{
    protected $model = SelfControl::class;

    public function definition(): array
    {
        return [
            'date' => fake()->dateTimeBetween('-30 days', 'now'),
            'heart_rate' => fake()->numberBetween(45, 190),
            'systolic_pressure' => fake()->numberBetween(90, 180),
            'diastolic_pressure' => fake()->numberBetween(60, 120),
            'body_weight' => fake()->randomFloat(1, 50, 110),
            'feeling' => fake()->numberBetween(1, 10),
            'description' => fake()->optional()->text(120),
            // athlete_id зададим вручную
        ];
    }
}