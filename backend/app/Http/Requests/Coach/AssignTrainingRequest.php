<?php

namespace App\Http\Requests\Coach;

use Illuminate\Foundation\Http\FormRequest;

class AssignTrainingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'athlete_ids' => ['required', 'array', 'min:1'],
            'athlete_ids.*' => ['integer', 'distinct', 'exists:athletes,user_id'],
            // опционально можно передать общий статус назначения
            'status' => ['sometimes', 'in:assigned,completed,skipped'],
        ];
    }
}
