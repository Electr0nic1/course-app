<?php

namespace App\Http\Requests\Athlete;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSelfControlRequest extends FormRequest
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
            'date' => ['sometimes', 'date'],
            'heart_rate' => ['sometimes', 'integer', 'min:1', 'max:250'],
            'systolic_pressure' => ['sometimes', 'integer', 'min:1', 'max:300'],
            'diastolic_pressure' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'body_weight' => ['nullable', 'numeric', 'min:1', 'max:200'],
            'feeling' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
