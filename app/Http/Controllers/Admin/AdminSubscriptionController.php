<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexSubscriptionRequest;
use App\Services\SubscriptionService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
    ) {}

    public function index(IndexSubscriptionRequest $request): Response
    {
        Gate::authorize('admin.subscriptions.viewAny');

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $this->subscriptionService->getSubscriptions($request->validated()),
            'stats'         => $this->subscriptionService->getSubscriptionStats(),
            'filters'       => $request->only(['search', 'plan', 'status']),
            'plans'         => ['free', 'starter', 'professional', 'enterprise'],
        ]);
    }
}
