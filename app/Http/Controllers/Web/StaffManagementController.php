<?php

namespace App\Http\Controllers\Web;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateStaffRequest;
use App\Http\Requests\CreateStaffWithPayrollRequest;
use App\Http\Requests\UpdateStaffWithPayrollRequest;
use App\Models\EmployeeTemplate;
use App\Models\PayCalendar;
use App\Models\User;
use App\Services\StaffManagementService;
use App\Services\StaffOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class StaffManagementController extends Controller
{
    public function __construct(
        protected StaffManagementService $staffService,
        protected StaffOnboardingService $onboardingService
    ) {}

    /**
     * Display a listing of staff members.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->only(['role', 'shop_id', 'is_active']);

        $staff = $this->staffService->list(
            $request->user()->tenant,
            $request->user(),
            $filters
        );

        $statistics = $this->staffService->getStatistics($request->user()->tenant);

        $shops = $request->user()->tenant->shops()
            ->select('id', 'name', 'slug')
            ->get();

        return Inertia::render('StaffManagement/Index', [
            'staff' => $staff,
            'statistics' => $statistics,
            'shops' => $shops,
            'roles' => UserRole::forSelect(),
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new staff member.
     */
    public function create(): Response
    {
        Gate::authorize('create', User::class);

        $accessData = $this->getAccessData();
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('StaffManagement/Create', [
            'roles' => $accessData['assignableRoles'],
            'shops' => $accessData['shops'],
            'payCalendars' => $this->getPayCalendars($tenantId),
            'employmentTypes' => EmploymentType::options(),
            'payTypes' => PayType::options(),
            'payFrequencies' => PayFrequency::options(),
            'taxHandlingOptions' => TaxHandling::options(),
            'departments' => $this->getDepartments($tenantId),
            'templates' => $this->getTemplates($tenantId),
        ]);
    }

    /**
     * Store a newly created staff member with payroll configuration.
     */
    public function store(CreateStaffWithPayrollRequest $request): RedirectResponse
    {
        $staff = $this->onboardingService->createStaffWithPayroll(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('users.show', $staff)
            ->with('success', "Staff member '{$staff->name}' has been created successfully with payroll configuration.");
    }

    /**
     * Store a staff member without payroll (simplified flow for backwards compatibility).
     */
    public function storeSimple(CreateStaffRequest $request): RedirectResponse
    {
        $staff = $this->staffService->create(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('users.index')
            ->with('success', "Staff member '{$staff->name}' has been created successfully.");
    }

    /**
     * Display the specified staff member.
     */
    public function show(User $staff): Response
    {
        Gate::authorize('view', $staff);

        $staff->load([
            'shops',
            'tenant',
            'employeePayrollDetail',
            'taxSettings',
            'customDeductions' => function ($query) {
                $query->latest();
            },
        ]);

        $canManagePayroll = Gate::allows('updatePayrollDetails', $staff);
        $canManageDeductions = Gate::allows('updateDeductionPreferences', $staff);

        return Inertia::render('StaffManagement/Show', [
            'staff' => $staff,
            'canManagePayroll' => $canManagePayroll,
            'canManageDeductions' => $canManageDeductions,
            'taxConfigurationStatus' => $this->getTaxConfigurationStatus($staff),
        ]);
    }

    /**
     * Show the form for editing the specified staff member.
     */
    public function edit(User $staff): Response
    {
        Gate::authorize('update', $staff);

        $staff->load(['shops', 'employeePayrollDetail', 'taxSettings', 'customDeductions']);

        $accessData = $this->getAccessData();
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('StaffManagement/Edit', [
            'staff' => $staff,
            'roles' => $accessData['assignableRoles'],
            'shops' => $accessData['shops'],
            'payCalendars' => $this->getPayCalendars($tenantId),
            'employmentTypes' => EmploymentType::options(),
            'payTypes' => PayType::options(),
            'payFrequencies' => PayFrequency::options(),
            'taxHandlingOptions' => TaxHandling::options(),
            'departments' => $this->getDepartments($tenantId),
            'canManagePayroll' => Gate::allows('updatePayrollDetails', $staff),
        ]);
    }

    /**
     * Update the specified staff member with payroll configuration.
     */
    public function update(UpdateStaffWithPayrollRequest $request, User $staff): RedirectResponse
    {
        $this->onboardingService->updateStaffWithPayroll(
            $staff,
            $request->validated()
        );

        return Redirect::route('users.show', $staff)
            ->with('success', "Staff member '{$staff->name}' has been updated successfully.");
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(User $staff): RedirectResponse
    {
        Gate::authorize('delete', $staff);

        $staffName = $staff->name;

        $this->staffService->delete($staff);

        return Redirect::route('users.index')
            ->with('success', "Staff member '$staffName' has been removed successfully.");
    }

    /**
     * Get assignable roles and shops based on current user's access level.
     */
    private function getAccessData(): array
    {
        $currentUser = auth()->user();

        $assignableRoles = collect(UserRole::cases())
            ->filter(function ($role) use ($currentUser) {

                return $role !== UserRole::OWNER
                    && $currentUser->role->level() > $role->level();
            })
            ->map(fn ($role) => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => $role->description(),
                'level' => $role->level(),
                'can_access_multiple_shops' => $role->canAccessMultipleStores(),
            ])
            ->values();

        $shops = $currentUser->tenant->shops()
            ->select('id', 'name', 'slug', 'city', 'state')
            ->where('is_active', true)
            ->get();

        return [
            'assignableRoles' => $assignableRoles,
            'shops' => $shops,
        ];
    }

    /**
     * Get pay calendars for the tenant.
     */
    private function getPayCalendars(int $tenantId): array
    {
        return PayCalendar::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->select('id', 'name', 'frequency', 'pay_day', 'is_default')
            ->get()
            ->toArray();
    }

    /**
     * Get departments for the tenant (from existing employee payroll details).
     */
    private function getDepartments(int $tenantId): array
    {
        return \App\Models\EmployeePayrollDetail::where('tenant_id', $tenantId)
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Get available employee templates for the tenant.
     */
    private function getTemplates(int $tenantId): array
    {
        return EmployeeTemplate::availableFor($tenantId)
            ->orderByDesc('is_system')
            ->orderByDesc('usage_count')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    /**
     * Get tax configuration status for display on staff profile.
     * Returns status information for NTA 2025 tax settings.
     */
    private function getTaxConfigurationStatus(User $staff): array
    {
        $taxSettings = $staff->taxSettings;

        if (! $taxSettings) {
            return [
                'status' => 'not_configured',
                'label' => 'Not Configured',
                'color' => 'warning',
                'is_homeowner' => null,
                'has_rent_proof' => false,
            ];
        }

        $isComplete = $taxSettings->tax_id_number !== null;

        return [
            'status' => $isComplete ? 'complete' : 'partial',
            'label' => $isComplete ? 'Configured' : 'Needs Attention',
            'color' => $isComplete ? 'success' : 'info',
            'is_homeowner' => $taxSettings->is_homeowner,
            'has_rent_proof' => $taxSettings->hasValidRentProof(),
        ];
    }
}
