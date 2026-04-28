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
use App\Http\Requests\IndexStaffRequest;
use App\Http\Requests\UpdateStaffWithPayrollRequest;
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

    public function index(IndexStaffRequest $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->validated();

        return Inertia::render('StaffManagement/Index', [
            'staff' => $this->staffService->list($request->user()->tenant, $request->user(), $filters),
            'statistics' => $this->staffService->getStatistics($request->user()->tenant),
            'shops' => $this->staffService->getShopsForIndex(),
            'roles' => UserRole::forSelect(),
            'filters' => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', User::class);

        return Inertia::render('StaffManagement/Create', [
            'roles' => $this->staffService->getAssignableRoles($request->user()),
            'shops' => $this->staffService->getShopsForForm(),
            'payCalendars' => $this->staffService->getPayCalendars(),
            'employmentTypes' => EmploymentType::options(),
            'payTypes' => PayType::options(),
            'payFrequencies' => PayFrequency::options(),
            'taxHandlingOptions' => TaxHandling::options(),
            'departments' => $this->staffService->getDepartments(),
            'templates' => $this->staffService->getTemplates($request->user()->tenant_id),
        ]);
    }

    public function store(CreateStaffWithPayrollRequest $request): RedirectResponse
    {
        Gate::authorize('create', User::class);

        $staff = $this->onboardingService->createStaffWithPayroll(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('users.show', $staff)
            ->with('success', "Staff member '{$staff->name}' has been created successfully with payroll configuration.");
    }

    public function storeSimple(CreateStaffRequest $request): RedirectResponse
    {
        Gate::authorize('create', User::class);

        $staff = $this->staffService->create(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('users.index')
            ->with('success', "Staff member '{$staff->name}' has been created successfully.");
    }

    public function show(User $staff): Response
    {
        Gate::authorize('view', $staff);

        $staff->loadStaffShowRelations();

        $canManagePayroll = Gate::allows('updatePayrollDetails', $staff);

        if ($canManagePayroll) {
            $staff->employeePayrollDetail?->makeVisible(['bank_account_number', 'routing_number', 'tax_id_number']);
        }

        return Inertia::render('StaffManagement/Show', [
            'staff' => $staff,
            'canManagePayroll' => $canManagePayroll,
            'canManageDeductions' => Gate::allows('updateDeductionPreferences', $staff),
            'taxConfigurationStatus' => $this->staffService->getTaxConfigurationStatus($staff),
        ]);
    }

    public function edit(Request $request, User $staff): Response
    {
        Gate::authorize('update', $staff);

        $staff->loadStaffEditRelations();

        if (Gate::allows('updatePayrollDetails', $staff)) {
            $staff->employeePayrollDetail?->makeVisible(['bank_account_number', 'routing_number', 'tax_id_number']);
        }

        return Inertia::render('StaffManagement/Edit', [
            'staff' => $staff,
            'roles' => $this->staffService->getAssignableRoles($request->user()),
            'shops' => $this->staffService->getShopsForForm(),
            'payCalendars' => $this->staffService->getPayCalendars(),
            'employmentTypes' => EmploymentType::options(),
            'payTypes' => PayType::options(),
            'payFrequencies' => PayFrequency::options(),
            'taxHandlingOptions' => TaxHandling::options(),
            'departments' => $this->staffService->getDepartments(),
            'canManagePayroll' => Gate::allows('updatePayrollDetails', $staff),
        ]);
    }

    public function update(UpdateStaffWithPayrollRequest $request, User $staff): RedirectResponse
    {
        Gate::authorize('update', $staff);

        $validated = $request->validated();

        $payrollFields = ['pay_amount', 'pay_type', 'pay_frequency', 'pay_calendar_id', 'commission_rate', 'commission_cap', 'bank_name', 'bank_account_number', 'routing_number'];
        if (array_intersect(array_keys($validated), $payrollFields)) {
            Gate::authorize('updatePayrollDetails', $staff);
        }

        $this->onboardingService->updateStaffWithPayroll($staff, $validated);

        return Redirect::route('users.show', $staff)
            ->with('success', "Staff member '{$staff->name}' has been updated successfully.");
    }

    public function destroy(User $staff): RedirectResponse
    {
        Gate::authorize('delete', $staff);

        $staffName = $staff->name;

        $this->staffService->delete($staff);

        return Redirect::route('users.index')
            ->with('success', "Staff member '$staffName' has been removed successfully.");
    }
}
