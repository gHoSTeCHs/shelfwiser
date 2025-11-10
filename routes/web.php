<?php

use App\Http\Controllers\ShopController;
use App\Http\Controllers\Web\StaffManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('staff')->name('users.')->group(function () {
        Route::get('/', [StaffManagementController::class, 'index'])->name('index');
    });

    Route::resource('shops', ShopController::class)
        ->only(['index', 'create', 'store', 'show', 'update', 'destroy']);

});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
