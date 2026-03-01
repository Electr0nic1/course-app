<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Training;
use App\Models\Athlete;

class Coach extends Model
{
    use HasFactory;

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'work_experience'
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function trainings(): HasMany {
        return $this->hasMany(Training::class, 'coach_id', 'user_id');
    }

    public function athletes(): HasMany {
        return $this->hasMany(Athlete::class, 'coach_id', 'user_id');
    }
}
