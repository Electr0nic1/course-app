<?php

use Illuminate\Support\Facades\Route;

// Auth
use App\Http\Controllers\Api\AuthController;

// Athlete
use App\Http\Controllers\Api\Athlete\ProfileController as AthleteProfileController;
use App\Http\Controllers\Api\Athlete\SelfControlController as AthleteSelfControlController;
use App\Http\Controllers\Api\Athlete\TrainingController as AthleteTrainingController;

// Coach
use App\Http\Controllers\Api\Coach\AthleteController as CoachAthleteController;
use App\Http\Controllers\Api\Coach\TrainingController as CoachTrainingController;
use App\Http\Controllers\Api\Coach\ReportController as CoachReportController;

// Admin
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // auth utilities
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    /*
    |--------------------------------------------------------------------------
    | Athlete routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('athlete')->middleware('role:athlete')->group(function () {
        Route::get('profile', [AthleteProfileController::class, 'show']);
        Route::post('profile', [AthleteProfileController::class, 'store']); // если профиля нет
        Route::put('profile', [AthleteProfileController::class, 'update']); // если нужно редактирование

        // self-control diary
        Route::apiResource('self-controls', AthleteSelfControlController::class);

        // my trainings
        Route::get('trainings', [AthleteTrainingController::class, 'index']);
        Route::get('trainings/{training}', [AthleteTrainingController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | Coach routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('coach')->middleware('role:coach')->group(function () {

        // list my athletes
        Route::get('athletes', [CoachAthleteController::class, 'index']);
        Route::get('athletes/{athlete}', [CoachAthleteController::class, 'show']);

        // athlete diary
        Route::get('athletes/{athlete}/self-controls', [CoachAthleteController::class, 'selfControls']);

        // trainings CRUD
        Route::apiResource('trainings', CoachTrainingController::class);

        // assign training to athletes
        Route::post('trainings/{training}/assign', [CoachTrainingController::class, 'assign']);

        // reports
        Route::get('reports', [CoachReportController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);

        // change role explicitly
        Route::put('users/{user}/role', [AdminUserController::class, 'updateRole']);
    });
});
