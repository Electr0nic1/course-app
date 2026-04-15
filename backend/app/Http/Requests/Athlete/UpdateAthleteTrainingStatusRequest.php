<?php

namespace App\Http\Requests\Athlete;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAthleteTrainingStatusRequest extends FormRequest
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
            'status' => ['required', 'string', 'in:assigned,completed,skipped'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Укажите статус участия в тренировке.',
            'status.in' => 'Недопустимый статус участия в тренировке.',
        ];
    }
}
