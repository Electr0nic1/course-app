<?php

namespace App\Providers;

use App\Models\SelfControl;
use App\Models\Training;
use App\Policies\SelfControlPolicy;
use App\Policies\TrainingPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        SelfControl::class => SelfControlPolicy::class,
        Training::class => TrainingPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}