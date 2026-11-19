<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SurveyFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    private function payload(): array
    {
        return [
            'title' => 'Launch feedback', 'slug' => 'launch-feedback', 'description' => 'Tell us what you think.', 'status' => 'draft',
            'questions' => [
                ['id' => 'recommend', 'text' => 'Recommend us?', 'type' => 'multiple_choice', 'required' => true, 'options' => ['Yes', 'No']],
                ['id' => 'reason', 'text' => 'Why not?', 'type' => 'text', 'required' => true, 'condition' => ['question_id' => 'recommend', 'value' => 'No']],
                ['id' => 'rating', 'text' => 'Rate us', 'type' => 'rating', 'required' => true],
                ['id' => 'features', 'text' => 'Favorite features', 'type' => 'checkbox', 'required' => false, 'options' => ['Speed', 'Design']],
            ],
        ];
    }

    public function test_complete_create_publish_submit_and_analytics_flow(): void
    {
        $created = $this->postJson('/api/admin/surveys', $this->payload())->assertCreated()->json('data');
        $this->getJson('/api/public/surveys/launch-feedback')->assertNotFound();
        $this->postJson("/api/admin/surveys/{$created['id']}/publish")->assertOk();
        $this->getJson('/api/public/surveys/launch-feedback')->assertOk();
        $this->postJson('/api/public/surveys/launch-feedback/responses', ['answers' => [
            'recommend' => 'Yes', 'rating' => 5, 'features' => ['Speed', 'Design'],
        ]])->assertCreated();
        $this->getJson("/api/admin/surveys/{$created['id']}/analytics")
            ->assertOk()->assertJsonPath('data.total_responses', 1)->assertJsonPath('data.questions.2.average', 5);
    }

    public function test_rejects_missing_visible_answers_and_answers_to_hidden_questions(): void
    {
        $payload = $this->payload();
        $payload['status'] = 'published';
        $this->postJson('/api/admin/surveys', $payload)->assertCreated();
        $this->postJson('/api/public/surveys/launch-feedback/responses', ['answers' => ['recommend' => 'No', 'rating' => 4]])
            ->assertUnprocessable()->assertJsonValidationErrors('answers.reason');
        $this->postJson('/api/public/surveys/launch-feedback/responses', ['answers' => ['recommend' => 'Yes', 'reason' => 'Hidden', 'rating' => 4]])
            ->assertUnprocessable()->assertJsonValidationErrors('answers.reason');
    }

    public function test_rejects_invalid_conditional_configuration(): void
    {
        $payload = $this->payload();
        $payload['questions'][1]['condition']['question_id'] = 'rating';
        $this->postJson('/api/admin/surveys', $payload)->assertUnprocessable()->assertJsonValidationErrors('questions.1.condition');
    }
}
