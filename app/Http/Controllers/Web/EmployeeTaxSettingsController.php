<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEmployeeTaxSettingsRequest;
use App\Http\Requests\UploadRentProofRequest;
use App\Models\User;
use App\Services\EmployeeTaxSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeTaxSettingsController extends Controller
{
    public function __construct(
        protected EmployeeTaxSettingsService $taxSettingsService
    ) {}

    public function show(Request $request, User $user): Response
    {
        Gate::authorize('view', $user);

        return Inertia::render('Staff/TaxSettings', [
            'employee' => $user->only(['id', 'name', 'email']),
            ...$this->taxSettingsService->getDisplayData($user),
        ]);
    }

    public function update(UpdateEmployeeTaxSettingsRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $this->taxSettingsService->updateSettings($user, $request->validated());

        return redirect()->back()->with('success', 'Tax settings updated successfully.');
    }

    public function uploadRentProof(UploadRentProofRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $this->taxSettingsService->uploadRentProof(
            user: $user,
            file: $request->file('rent_proof_document'),
            expiry: $request->input('rent_proof_expiry'),
        );

        return redirect()->back()->with('success', 'Rent proof document uploaded successfully.');
    }

    public function deleteRentProof(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $this->taxSettingsService->deleteRentProof($user);

        return redirect()->back()->with('success', 'Rent proof document removed.');
    }

    public function previewTax(Request $request, User $user): JsonResponse
    {
        Gate::authorize('view', $user);

        return response()->json(
            $this->taxSettingsService->previewTax($user, $request->input('effective_date'))
        );
    }

    public function compareTaxLaws(Request $request, User $user): JsonResponse
    {
        Gate::authorize('view', $user);

        $comparison = $this->taxSettingsService->compareTaxLaws($user);

        if ($comparison === null) {
            return response()->json(['error' => 'Employee has no payroll details'], 422);
        }

        return response()->json($comparison);
    }
}
