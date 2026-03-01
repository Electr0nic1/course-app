<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // role titles MUST match middleware checks: admin/coach/athlete
        $roles = ['admin', 'coach', 'athlete'];

        foreach ($roles as $title) {
            Role::firstOrCreate(['title' => $title]);
        }
    }
}