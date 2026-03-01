<?php

namespace Database\Seeders;

use App\Models\TrainingType;
use Illuminate\Database\Seeder;

class TrainingTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['cardio', 'strength', 'stretching', 'recovery'];

        foreach ($types as $title) {
            TrainingType::firstOrCreate(['title' => $title]);
        }
    }
}