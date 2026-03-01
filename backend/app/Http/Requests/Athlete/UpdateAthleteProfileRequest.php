<?php

namespace App\Http\Requests\Athlete;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAthleteProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'initial_weight' => ['sometimes', 'numeric', 'min:20', 'max:250'],
            'height' => ['sometimes', 'numeric', 'min:80', 'max:250'],
            'coach_id' => ['nullable', 'integer', 'exists:coaches,user_id'],
        ];
    }
}