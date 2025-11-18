<?php

namespace App\Http\Controllers;

use App\Enums\ConnectionStatus;
use App\Http\Requests\Supplier\RequestConnectionRequest;
use App\Http\Requests\Supplier\UpdateConnectionTermsRequest;
use App\Models\SupplierConnection;
use App\Models\Tenant;
use App\Services\SupplierConnectionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class SupplierConnectionController extends Controller
{
    public function __construct(private readonly SupplierConnectionService $connectionService) {}

    /**
     * @throws AuthorizationException
     */
    public function index(): Response
    {
        Gate::authorize('viewAny', SupplierConnection::class);

        $tenantId = auth()->user()->tenant_id;

        $buyerConnections = $this->connectionService->getConnectionsForBuyer(auth()->user()->tenant);
        $supplierConnections = $this->connectionService->getConnectionsForSupplier(auth()->user()->tenant);

        return Inertia::render('Supplier/Connections/Index', [
            'buyerConnections' => $buyerConnections,
            'supplierConnections' => $supplierConnections,
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function pending(): Response
    {
        Gate::authorize('viewAny', SupplierConnection::class);

        $pendingConnections = $this->connectionService->getConnectionsForSupplier(
            auth()->user()->tenant,
            ConnectionStatus::PENDING
        );

        return Inertia::render('Supplier/Connections/Pending', [
            'connections' => $pendingConnections,
        ]);
    }

    public function store(RequestConnectionRequest $request, Tenant $supplierTenant): RedirectResponse
    {
        $this->connectionService->requestConnection(
            auth()->user()->tenant,
            $supplierTenant,
            $request->validated()
        );

        return Redirect::route('supplier.connections.index')
            ->with('success', "Connection request sent to $supplierTenant->name.");
    }

    /**
     * @throws AuthorizationException
     */
    public function approve(SupplierConnection $connection): RedirectResponse
    {
        Gate::authorize('approve', $connection);

        $this->connectionService->approveConnection($connection, auth()->user());

        return Redirect::back()
            ->with('success', 'Connection approved successfully.');
    }

    /**
     * @throws AuthorizationException
     */
    public function reject(SupplierConnection $connection): RedirectResponse
    {
        Gate::authorize('reject', $connection);

        $this->connectionService->rejectConnection($connection);

        return Redirect::back()
            ->with('success', 'Connection rejected.');
    }

    /**
     * @throws AuthorizationException
     */
    public function suspend(SupplierConnection $connection): RedirectResponse
    {
        Gate::authorize('suspend', $connection);

        $this->connectionService->suspendConnection($connection);

        return Redirect::back()
            ->with('success', 'Connection suspended.');
    }

    /**
     * @throws AuthorizationException
     */
    public function activate(SupplierConnection $connection): RedirectResponse
    {
        Gate::authorize('activate', $connection);

        $this->connectionService->activateConnection($connection);

        return Redirect::back()
            ->with('success', 'Connection activated.');
    }

    public function updateTerms(UpdateConnectionTermsRequest $request, SupplierConnection $connection): RedirectResponse
    {
        $this->connectionService->updateConnectionTerms($connection, $request->validated());

        return Redirect::back()
            ->with('success', 'Connection terms updated successfully.');
    }
}
