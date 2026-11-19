<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveSurveyRequest;
use App\Http\Resources\SurveyResource;
use App\Models\Survey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SurveyController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json(['data' => [
            'total_surveys' => Survey::count(),
            'active_surveys' => Survey::where('status', 'published')->count(),
            'total_responses' => DB::table('responses')->count(),
            'recent_surveys' => SurveyResource::collection(Survey::withCount('responses')->latest('updated_at')->limit(8)->get()),
        ]]);
    }

    public function index(): AnonymousResourceCollection
    {
        return SurveyResource::collection(Survey::withCount('responses')->latest('updated_at')->paginate(15));
    }

    public function store(SaveSurveyRequest $request): SurveyResource
    {
        $survey = Survey::create($this->payload($request));

        return (new SurveyResource($survey->loadCount('responses')))->additional(['message' => 'Survey created.']);
    }

    public function show(Survey $survey): SurveyResource
    {
        return new SurveyResource($survey->loadCount('responses'));
    }

    public function update(SaveSurveyRequest $request, Survey $survey): SurveyResource
    {
        $survey->update($this->payload($request, $survey));

        return (new SurveyResource($survey->refresh()->loadCount('responses')))->additional(['message' => 'Survey saved.']);
    }

    public function destroy(Survey $survey): JsonResponse
    {
        $survey->delete();

        return response()->json(['message' => 'Survey deleted.']);
    }

    public function publish(Survey $survey): SurveyResource
    {
        $survey->update(['status' => 'published']);

        return (new SurveyResource($survey))->additional(['message' => 'Survey published.']);
    }

    public function unpublish(Survey $survey): SurveyResource
    {
        $survey->update(['status' => 'draft']);

        return (new SurveyResource($survey))->additional(['message' => 'Survey moved to draft.']);
    }

    public function analytics(Survey $survey): JsonResponse
    {
        $responses = $survey->responses()->with('answers')->latest('submitted_at')->get();
        $total = $responses->count();
        $result = collect($survey->schema['questions'] ?? [])->map(function ($question) use ($responses, $total) {
            $values = $responses->flatMap(fn ($response) => $response->answers->where('question_id', $question['id'])->pluck('value'));
            $data = ['id' => $question['id'], 'text' => $question['text'], 'type' => $question['type'], 'answered' => $values->count()];
            if (in_array($question['type'], ['multiple_choice', 'checkbox'], true)) {
                $flat = $question['type'] === 'checkbox' ? $values->flatten() : $values;
                $data['options'] = collect($question['options'])->map(function ($option) use ($flat, $total) {
                    $count = $flat->filter(fn ($v) => $v === $option)->count();

                    return ['option' => $option, 'count' => $count, 'percentage' => $total ? round($count / $total * 100, 1) : 0];
                })->values();
            } elseif ($question['type'] === 'rating') {
                $data['average'] = $values->count() ? round($values->avg(), 2) : null;
                $data['ratings'] = collect(range(1, 5))->map(fn ($rating) => ['rating' => $rating, 'count' => $values->filter(fn ($v) => $v === $rating)->count()]);
            } else {
                $data['answers'] = $values->filter()->values()->take(100);
            }

            return $data;
        });

        return response()->json(['data' => ['survey' => new SurveyResource($survey), 'total_responses' => $total, 'questions' => $result]]);
    }

    private function payload(SaveSurveyRequest $request, ?Survey $survey = null): array
    {
        $data = $request->validated();

        return [
            'title' => $data['title'],
            'slug' => $data['slug'] ?? $survey?->slug ?? $this->uniqueSlug($data['title']),
            'description' => $data['description'] ?? null,
            'status' => $data['status'],
            'schema' => ['version' => 1, 'questions' => array_values($data['questions'])],
        ];
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'survey';
        $slug = $base;
        $i = 2;
        while (Survey::where('slug', $slug)->exists()) {
            $slug = "$base-".$i++;
        }

        return $slug;
    }
}
