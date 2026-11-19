<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SurveyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'status' => $this->status,
            'questions' => $this->schema['questions'] ?? [],
            'response_count' => $this->whenCounted('responses'),
            'updated_at' => $this->updated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
