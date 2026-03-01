<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Training;

class TrainingType extends Model
{
    protected $fillable = [
        'title'
    ];

    public function trainings(): HasMany {
        return $this->hasMany(Training::class, 'training_type_id', 'id');
    }
}
