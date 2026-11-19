<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveSurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('surveys')->ignore($this->route('survey'))],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'questions' => ['required', 'array', 'min:1', 'max:100'],
            'questions.*.id' => ['required', 'string', 'max:64', 'distinct', 'regex:/^[A-Za-z0-9_-]+$/'],
            'questions.*.text' => ['required', 'string', 'max:500'],
            'questions.*.type' => ['required', Rule::in(['text', 'multiple_choice', 'checkbox', 'rating'])],
            'questions.*.required' => ['required', 'boolean'],
            'questions.*.options' => ['sometimes', 'array', 'max:30'],
            'questions.*.options.*' => ['string', 'max:200', 'distinct'],
            'questions.*.condition' => ['nullable', 'array'],
            'questions.*.condition.question_id' => ['required_with:questions.*.condition', 'string'],
            'questions.*.condition.value' => ['required_with:questions.*.condition', 'string', 'max:200'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $prior = [];
            foreach ($this->input('questions', []) as $i => $question) {
                $type = $question['type'] ?? null;
                $options = $question['options'] ?? [];
                if (in_array($type, ['multiple_choice', 'checkbox'], true) && count($options) < 2) {
                    $validator->errors()->add("questions.$i.options", 'Choice questions require at least two unique options.');
                }
                $condition = $question['condition'] ?? null;
                if ($condition) {
                    $source = $prior[$condition['question_id'] ?? ''] ?? null;
                    if (! $source || ($source['type'] ?? null) !== 'multiple_choice') {
                        $validator->errors()->add("questions.$i.condition", 'The condition must reference an earlier multiple-choice question.');
                    } elseif (! in_array($condition['value'] ?? null, $source['options'] ?? [], true)) {
                        $validator->errors()->add("questions.$i.condition.value", 'The condition value must be one of the source question options.');
                    }
                }
                if (isset($question['id'])) {
                    $prior[$question['id']] = $question;
                }
            }
        }];
    }
}
