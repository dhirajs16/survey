<?php

namespace App\Http\Controllers;

use App\Http\Resources\SurveyResource;
use App\Models\Survey;
use App\Services\ResponseValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicSurveyController extends Controller
{
    public function show(string $slug): SurveyResource
    {
        return new SurveyResource(Survey::where('slug', $slug)->where('status', 'published')->firstOrFail());
    }

    public function store(Request $request, string $slug, ResponseValidator $responseValidator): JsonResponse
    {
        $survey = Survey::where('slug', $slug)->where('status', 'published')->firstOrFail();
        $validated = $request->validate(['answers' => ['required', 'array']]);
        $answers = $responseValidator->validate($survey->schema['questions'] ?? [], $validated['answers']);
        DB::transaction(function () use ($survey, $answers, $request) {
            $response = $survey->responses()->create([
                'submitted_at' => now(),
                'ip_hash' => $request->ip() ? hash_hmac('sha256', $request->ip(), config('app.key')) : null,
            ]);
            foreach ($answers as $questionId => $value) {
                $response->answers()->create(['question_id' => $questionId, 'value' => $value]);
            }
        });

        return response()->json(['message' => 'Thank you! Your response has been recorded.'], 201);
    }
}
