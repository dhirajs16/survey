<?php

namespace Database\Seeders;

use App\Models\Survey;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@gmail.com'], [
            'name' => 'Survey Admin',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        Survey::updateOrCreate(['slug' => 'product-feedback'], [
            'title' => 'Product experience survey',
            'description' => 'Help us understand what works and where we can improve. It takes about two minutes.',
            'status' => 'published',
            'schema' => ['version' => 1, 'questions' => [
                ['id' => 'experience', 'text' => 'How would you rate your overall experience?', 'type' => 'rating', 'required' => true],
                ['id' => 'recommend', 'text' => 'Would you recommend us to a colleague?', 'type' => 'multiple_choice', 'required' => true, 'options' => ['Yes', 'No']],
                ['id' => 'highlights', 'text' => 'What did you find most valuable?', 'type' => 'checkbox', 'required' => false, 'options' => ['Ease of use', 'Speed', 'Support', 'Design']],
                ['id' => 'reason', 'text' => 'What held you back from recommending us?', 'type' => 'text', 'required' => true, 'condition' => ['question_id' => 'recommend', 'value' => 'No']],
                ['id' => 'comments', 'text' => 'Anything else you would like us to know?', 'type' => 'text', 'required' => false],
            ]],
        ]);
    }
}
