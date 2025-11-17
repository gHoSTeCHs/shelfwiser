<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;

class NotificationPolicy
{
    /**
     * Determine if the user can view any notifications
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can view the notification
     */
    public function view(User $user, Notification $notification): bool
    {
        if ($notification->tenant_id !== $user->tenant_id) {
            return false;
        }

        return $notification->isForUser($user);
    }

    /**
     * Determine if the user can mark the notification as read
     */
    public function markAsRead(User $user, Notification $notification): bool
    {
        return $this->view($user, $notification);
    }

    /**
     * Determine if the user can delete the notification
     */
    public function delete(User $user, Notification $notification): bool
    {
        return $this->view($user, $notification);
    }
}
