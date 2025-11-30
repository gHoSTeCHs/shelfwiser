<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderReturn;
use App\Services\OrderReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class OrderReturnController extends Controller
{
    public function __construct(
        private readonly OrderReturnService $returnService
    ) {}

    /**
     * Display a listing of returns
     */
    public function index(Request $request): Response
    {
        $tenant = auth()->user()->tenant;

        $query = OrderReturn::query()
            ->where('tenant_id', $tenant->id)
            ->with(['order', 'items.orderItem', 'createdByUser'])
            ->latest();

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $returns = $query->paginate(20);

        return Inertia::render('Returns/Index', [
            'returns' => $returns,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Show the form for creating a new return
     */
    public function create(Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->load(['items.productVariant.product', 'customer']);

        return Inertia::render('Returns/Create', [
            'order' => $order,
        ]);
    }

    /**
     * Store a newly created return
     */
    public function store(Request $request, Order $order): RedirectResponse
    {
        Gate::authorize('view', $order);

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.reason' => 'nullable|string|max:500',
            'items.*.condition_notes' => 'nullable|string|max:1000',
        ]);

        // Transform items array to the format expected by the service
        $items = collect($validated['items'])->mapWithKeys(function ($item) {
            return [$item['order_item_id'] => [
                'quantity' => $item['quantity'],
                'reason' => $item['reason'] ?? null,
                'condition_notes' => $item['condition_notes'] ?? null,
            ]];
        })->toArray();

        $return = $this->returnService->createReturn(
            $order,
            $request->user(),
            $items,
            $validated['reason'],
            $validated['notes'] ?? null
        );

        return Redirect::route('returns.show', $return)->with('success', 'Return request created successfully.');
    }

    /**
     * Display the specified return
     */
    public function show(OrderReturn $return): Response
    {
        if ($return->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to return');
        }

        $return->load([
            'order.items.productVariant.product',
            'order.customer',
            'items.orderItem.productVariant.product',
            'createdByUser',
            'approvedByUser',
            'rejectedByUser',
            'completedByUser',
        ]);

        return Inertia::render('Returns/Show', [
            'return' => $return,
            'can_approve' => Gate::allows('manage', $return->order->shop),
        ]);
    }

    /**
     * Approve a return request
     */
    public function approve(Request $request, OrderReturn $return): RedirectResponse
    {
        if ($return->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to return');
        }

        Gate::authorize('manage', $return->order->shop);

        $validated = $request->validate([
            'restock_items' => 'boolean',
            'process_refund' => 'boolean',
        ]);

        $this->returnService->approveReturn(
            $return,
            $request->user(),
            $validated['restock_items'] ?? true,
            $validated['process_refund'] ?? true
        );

        return Redirect::back()->with('success', 'Return approved successfully.');
    }

    /**
     * Reject a return request
     */
    public function reject(Request $request, OrderReturn $return): RedirectResponse
    {
        if ($return->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to return');
        }

        Gate::authorize('manage', $return->order->shop);

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
        ]);

        $this->returnService->rejectReturn(
            $return,
            $request->user(),
            $validated['rejection_reason'] ?? null
        );

        return Redirect::back()->with('success', 'Return rejected.');
    }

    /**
     * Complete a return
     */
    public function complete(Request $request, OrderReturn $return): RedirectResponse
    {
        if ($return->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized access to return');
        }

        Gate::authorize('manage', $return->order->shop);

        $this->returnService->completeReturn(
            $return,
            $request->user()
        );

        return Redirect::back()->with('success', 'Return completed.');
    }
}
