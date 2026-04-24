<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApproveOrderReturnRequest;
use App\Http\Requests\CompleteOrderReturnRequest;
use App\Http\Requests\IndexOrderReturnRequest;
use App\Http\Requests\RejectOrderReturnRequest;
use App\Http\Requests\StoreOrderReturnRequest;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Services\OrderReturnService;
use Illuminate\Http\RedirectResponse;
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
    public function index(IndexOrderReturnRequest $request): Response
    {
        Gate::authorize('viewAny', OrderReturn::class);

        return Inertia::render('Returns/Index', [
            'returns' => $this->returnService->getReturnsList($request->user(), $request->validated()),
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Show the form for creating a new return
     */
    public function create(Order $order): Response
    {
        Gate::authorize('view', $order);

        return Inertia::render('Returns/Create', [
            'order' => $this->returnService->getOrderForReturnCreate($order),
        ]);
    }

    /**
     * Store a newly created return
     */
    public function store(StoreOrderReturnRequest $request, Order $order): RedirectResponse
    {
        Gate::authorize('create', OrderReturn::class);

        $validated = $request->validated();

        $return = $this->returnService->createReturn(
            $order,
            $request->user(),
            $validated['items'],
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
        Gate::authorize('view', $return);

        $return->loadShowRelations();

        return Inertia::render('Returns/Show', [
            'return' => $return,
            'can_approve' => Gate::allows('manage', $return->order->shop),
        ]);
    }

    /**
     * Approve a return request
     */
    public function approve(ApproveOrderReturnRequest $request, OrderReturn $return): RedirectResponse
    {
        Gate::authorize('manage', $return);

        $validated = $request->validated();

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
    public function reject(RejectOrderReturnRequest $request, OrderReturn $return): RedirectResponse
    {
        Gate::authorize('manage', $return);

        $validated = $request->validated();

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
    public function complete(CompleteOrderReturnRequest $request, OrderReturn $return): RedirectResponse
    {
        Gate::authorize('manage', $return);

        $this->returnService->completeReturn(
            $return,
            $request->user()
        );

        return Redirect::back()->with('success', 'Return completed.');
    }
}
