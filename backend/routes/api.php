<?php

use Illuminate\Support\Facades\Route;

// Auth
use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\Dashboard\TrainingStatusController;
use App\Http\Controllers\Api\Dashboard\DashboardController;

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
use App\Http\Controllers\Api\Admin\ActivityLogController;

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
    Route::patch('/trainings/{id}/status', [TrainingStatusController::class, 'update']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

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
        Route::post('profile', [AthleteProfileController::class, 'store']);
        Route::put('profile', [AthleteProfileController::class, 'update']); 

        Route::apiResource('self-controls', AthleteSelfControlController::class);

        Route::get('trainings', [AthleteTrainingController::class, 'index']);
        Route::get('trainings/{training}', [AthleteTrainingController::class, 'show']);
        Route::patch('trainings/{trainingId}/status', [AthleteTrainingController::class, 'updateStatus']);
    });

    /*
    |--------------------------------------------------------------------------
    | Coach routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('coach')->middleware('role:coach')->group(function () {

        Route::get('athletes', [CoachAthleteController::class, 'index']);
        Route::get('athletes/{athlete}', [CoachAthleteController::class, 'show']);

        Route::get('athletes/{athlete}/self-controls', [CoachAthleteController::class, 'selfControls']);
        Route::apiResource('trainings', CoachTrainingController::class);
        Route::post('trainings/{training}/assign', [CoachTrainingController::class, 'assign']);
        Route::get('reports', [CoachReportController::class, 'index']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::put('users/{user}/role', [AdminUserController::class, 'updateRole']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
    });
});
