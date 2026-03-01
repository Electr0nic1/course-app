<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Athlete;

class SelfControl extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'heart_rate',
        'systolic_pressure',
        'diastolic_pressure',
        'feeling',
        'body_weight',
        'description',
        'athlete_id'
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'heart_rate' => 'integer',
            'systolic_pressure' => 'integer',
            'diastolic_pressure' => 'integer',
            'feeling' => 'integer',
            'body_weight' => 'decimal:1',
        ];
    }

    public function athlete(): BelongsTo {
        return $this->belongsTo(Athlete::class, 'athlete_id', 'user_id');
    }
}
