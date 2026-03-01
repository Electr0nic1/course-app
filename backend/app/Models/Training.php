<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\TrainingType;
use App\Models\Athlete;
use App\Models\Coach;


class Training extends Model
{
    use HasFactory;
    protected $fillable = [
        'training_type_id',
        'coach_id',
        'date',
        'duration_minutes',
        'description',
        'status'
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'duration_minutes' => 'integer'
        ];
    }

    public function trainingType(): BelongsTo {
        return $this->belongsTo(TrainingType::class, 'training_type_id', 'id');
    }

    public function athletes(): BelongsToMany {
        return $this->belongsToMany(
            Athlete::class,
            'athlete_training',
            'training_id',
            'athlete_id',
            'id',
            'user_id'
            )->withPivot('status')->withTimestamps();
    }

    public function coach(): BelongsTo {
        return $this->belongsTo(Coach::class, 'coach_id', 'user_id');
    }
}
