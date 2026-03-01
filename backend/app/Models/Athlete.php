<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Training;
use App\Models\User;
use App\Models\Coach;
use App\Models\SelfControl;

class Athlete extends Model
{
    use HasFactory;

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'coach_id',
        'initial_weight',
        'height'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class, 'coach_id', 'user_id');
    }

    public function trainings(): BelongsToMany
    {
        return $this->belongsToMany(
            Training::class,
            'athlete_training',
            'athlete_id',
            'training_id',
            'user_id',
            'id'
        )->withPivot('status')->withTimestamps();
    }

    public function selfControls(): HasMany
    {
        return $this->hasMany(SelfControl::class, 'athlete_id', 'user_id');
    }
}
