<?php

namespace Database\Factories;

use App\Models\Training;
use App\Models\TrainingType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Training>
 */
class TrainingFactory extends Factory
{
    protected $model = Training::class;

    public function definition(): array
    {
        $typeId = TrainingType::query()->inRandomOrder()->value('id');

        return [
            'training_type_id' => $typeId,
            'date' => fake()->dateTimeBetween('-14 days', '+14 days'),
            'duration_minutes' => fake()->numberBetween(20, 120),
            'description' => fake()->optional()->sentence(),
            'status' => fake()->randomElement(['planned', 'done', 'canceled']),
        ];
    }
}