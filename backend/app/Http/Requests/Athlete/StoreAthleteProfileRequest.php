<?php

namespace App\Http\Requests\Athlete;

use Illuminate\Foundation\Http\FormRequest;

class StoreAthleteProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'initial_weight' => ['required', 'numeric', 'min:20', 'max:250'],
            'height' => ['required', 'numeric', 'min:80', 'max:250'],
            // если ты хочешь назначать тренера сразу:
            'coach_id' => ['nullable', 'integer', 'exists:coaches,user_id'],
        ];
    }
}