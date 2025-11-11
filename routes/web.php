<?php

use App\Http\Controllers\ProductController;
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
        Route::get('/create', [StaffManagementController::class, 'create'])->name('create');
        Route::post('/', [StaffManagementController::class, 'store'])->name('store');
        Route::get('/{staff}', [StaffManagementController::class, 'show'])->name('show');
        Route::get('/{staff}/edit', [StaffManagementController::class, 'edit'])->name('edit');
        Route::put('/{staff}', [StaffManagementController::class, 'update'])->name('update');
        Route::delete('/{staff}', [StaffManagementController::class, 'destroy'])->name('destroy');
    });

    Route::resource('shops', ShopController::class);

    Route::resource('products', ProductController::class);

});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
