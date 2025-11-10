<?php

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Models\User;
use App\Services\StaffManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class StaffManagementController extends Controller
{
    public function __construct(
        protected StaffManagementService $staffService
    )
    {
    }

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

        return Inertia::render('StaffManagement/Create', [
            'roles' => $accessData['assignableRoles'],
            'shops' => $accessData['shops'],
        ]);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(CreateStaffRequest $request): RedirectResponse
    {
        $staff = $this->staffService->create(
            $request->validated(),
            $request->user()->tenant,
            $request->user()
        );

        return Redirect::route('users.index')
            ->with('success', "Staff member '$staff->name' has been created successfully.");
    }

    /**
     * Display the specified staff member.
     */
    public function show(User $staff): Response
    {
        Gate::authorize('view', $staff);

        $staff->load(['shops', 'tenant']);

        return Inertia::render('StaffManagement/Show', [
            'staff' => $staff,
        ]);
    }

    /**
     * Show the form for editing the specified staff member.
     */
    public function edit(User $staff): Response
    {
        Gate::authorize('update', $staff);

        $staff->load('shops');

        $accessData = $this->getAccessData();

        return Inertia::render('StaffManagement/Edit', [
            'staff' => $staff,
            'roles' => $accessData['assignableRoles'],
            'shops' => $accessData['shops'],
        ]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(UpdateStaffRequest $request, User $staff): RedirectResponse
    {
        $this->staffService->update(
            $staff,
            $request->validated(),
            $request->user()
        );

        return Redirect::route('users.index')
            ->with('success', "Staff member '$staff->name' has been updated successfully.");
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
            ->map(fn($role) => [
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
}
