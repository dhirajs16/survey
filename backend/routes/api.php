<?php

use App\Http\Controllers\Admin\SurveyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PublicSurveyController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);
});

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::get('dashboard', [SurveyController::class, 'dashboard']);
    Route::apiResource('surveys', SurveyController::class);
    Route::post('surveys/{survey}/publish', [SurveyController::class, 'publish']);
    Route::post('surveys/{survey}/unpublish', [SurveyController::class, 'unpublish']);
    Route::get('surveys/{survey}/analytics', [SurveyController::class, 'analytics']);
});
Route::get('public/surveys/{slug}', [PublicSurveyController::class, 'show']);
Route::post('public/surveys/{slug}/responses', [PublicSurveyController::class, 'store'])->middleware('throttle:20,1');
