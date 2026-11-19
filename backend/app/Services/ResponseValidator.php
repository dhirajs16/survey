<?php

namespace App\Services;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ResponseValidator
{
    public function validate(array $questions, array $answers): array
    {
        $byId = collect($questions)->keyBy('id');
        $unknown = array_diff(array_keys($answers), $byId->keys()->all());
        if ($unknown) {
            throw ValidationException::withMessages(['answers' => ['Unknown question IDs: '.implode(', ', $unknown)]]);
        }

        $clean = [];
        foreach ($questions as $question) {
            $id = $question['id'];
            $visible = ! isset($question['condition']) || (($answers[$question['condition']['question_id']] ?? null) === $question['condition']['value']);
            if (! $visible) {
                if (array_key_exists($id, $answers)) {
                    throw ValidationException::withMessages(["answers.$id" => ['Answers to hidden questions are not accepted.']]);
                }

                continue;
            }
            $value = $answers[$id] ?? null;
            if (($question['required'] ?? false) && ($value === null || $value === '' || $value === [])) {
                throw ValidationException::withMessages(["answers.$id" => ['This question is required.']]);
            }
            if ($value === null || $value === '' || $value === []) {
                continue;
            }

            $rules = match ($question['type']) {
                'text' => ['string', 'max:5000'],
                'rating' => ['integer', 'between:1,5'],
                'multiple_choice' => ['string', Rule::in($question['options'] ?? [])],
                'checkbox' => ['array', 'min:1'],
            };
            $validator = Validator::make(['value' => $value], ['value' => $rules]);
            if ($question['type'] === 'checkbox') {
                $validator->after(function ($v) use ($value, $question) {
                    if (is_array($value) && (count($value) !== count(array_unique($value)) || array_diff($value, $question['options'] ?? []))) {
                        $v->errors()->add('value', 'One or more selections are invalid.');
                    }
                });
            }
            if ($validator->fails()) {
                throw ValidationException::withMessages(["answers.$id" => $validator->errors()->all()]);
            }
            $clean[$id] = $value;
        }

        return $clean;
    }
}
