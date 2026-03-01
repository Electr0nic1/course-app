<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password = null;

    public function definition(): array
    {
        // По умолчанию создаём athlete (если роль есть)
        $athleteRoleId = Role::where('title', 'athlete')->value('id');

        return [
            'role_id' => $athleteRoleId ?? 1,
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'birth_date' => fake()->date(),
            'gender' => fake()->randomElement(['male', 'female']),
            'remember_token' => Str::random(10),
        ];
    }

    public function role(string $title): static
    {
        return $this->state(function () use ($title) {
            $roleId = Role::where('title', $title)->value('id');
            return ['role_id' => $roleId];
        });
    }
}