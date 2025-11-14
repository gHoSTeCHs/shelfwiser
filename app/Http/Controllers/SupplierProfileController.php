<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\EnableSupplierModeRequest;
use App\Http\Requests\Supplier\UpdateSupplierProfileRequest;
use App\Models\SupplierProfile;
use App\Services\SupplierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class SupplierProfileController extends Controller
{
    public function __construct(private readonly SupplierService $supplierService)
    {
    }

    public function index(): Response
    {
//        Gate::authorize('viewAny', SupplierProfile::class);

        $tenant = auth()->user()->tenant;
        $profile = $tenant->supplierProfile;

        return Inertia::render('Supplier/Profile/Index', [
            'profile' => $profile,
            'isSupplier' => $tenant->isSupplier(),
        ]);
    }

    public function enable(EnableSupplierModeRequest $request): RedirectResponse
    {
        $tenant = auth()->user()->tenant;

        $profile = $this->supplierService->enableSupplierMode($tenant, $request->validated());

        return Redirect::route('supplier.profile.index')
            ->with('success', 'Supplier mode enabled successfully.');
    }

    public function update(UpdateSupplierProfileRequest $request, SupplierProfile $profile): RedirectResponse
    {
        $this->supplierService->updateSupplierProfile($profile, $request->validated());

        return Redirect::route('supplier.profile.index')
            ->with('success', 'Supplier profile updated successfully.');
    }

    public function disable(): RedirectResponse
    {
        Gate::authorize('updateProfile', auth()->user()->tenant->supplierProfile);

        $this->supplierService->disableSupplierMode(auth()->user()->tenant);

        return Redirect::route('supplier.profile.index')
            ->with('success', 'Supplier mode disabled successfully.');
    }
}
