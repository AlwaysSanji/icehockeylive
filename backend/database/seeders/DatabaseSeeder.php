<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default scorekeeper and operator accounts with secure hashed passwords
        User::firstOrCreate(
            ['email' => 'admin@nhl.com'],
            [
                'name' => 'Scorekeeper',
                'username' => 'admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator@nhl.com'],
            [
                'name' => 'Game Operator',
                'username' => 'user',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );
    }
}
