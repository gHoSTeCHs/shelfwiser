<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Notification::class);

        $limit = $request->integer('limit', 20);
        $unreadOnly = $request->boolean('unread_only', false);

        $notifications = $this->notificationService->getForUser(
            auth()->user(),
            $limit,
            $unreadOnly
        );

        return response()->json([
            'notifications' => $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type->value,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'action_url' => $notification->action_url,
                    'is_read' => $notification->is_read,
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at->toIso8601String(),
                    'icon' => $notification->type->icon(),
                    'color' => $notification->type->color(),
                    'shop' => $notification->shop ? [
                        'id' => $notification->shop->id,
                        'name' => $notification->shop->name,
                    ] : null,
                ];
            }),
            'unread_count' => $this->notificationService->getUnreadCount(auth()->user()),
        ]);
    }

    /**
     * Get unread count for the authenticated user
     */
    public function unreadCount(): JsonResponse
    {
        return response()->json([
            'count' => $this->notificationService->getUnreadCount(auth()->user()),
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        Gate::authorize('markAsRead', $notification);

        $this->notificationService->markAsRead($notification);

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => $this->notificationService->getUnreadCount(auth()->user()),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        Gate::authorize('viewAny', Notification::class);

        $this->notificationService->markAllAsRead(auth()->user());

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Notification $notification): JsonResponse
    {
        Gate::authorize('delete', $notification);

        $this->notificationService->delete($notification);

        return response()->json([
            'message' => 'Notification deleted',
            'unread_count' => $this->notificationService->getUnreadCount(auth()->user()),
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function deleteAllRead(): JsonResponse
    {
        Gate::authorize('viewAny', Notification::class);

        $this->notificationService->deleteAllRead(auth()->user());

        return response()->json([
            'message' => 'All read notifications deleted',
        ]);
    }
}
