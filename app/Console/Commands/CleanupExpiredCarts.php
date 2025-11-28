<?php

namespace App\Console\Commands;

use App\Models\Cart;
use Illuminate\Console\Command;

class CleanupExpiredCarts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'carts:cleanup
                            {--days=30 : Delete guest carts older than this many days}
                            {--dry-run : Display what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired and old guest carts to free up database space';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $guestCartDays = (int) $this->option('days');

        $this->info('Starting cart cleanup process...');
        $this->newLine();

        // 1. Delete explicitly expired carts
        $expiredQuery = Cart::where('expires_at', '<=', now());
        $expiredCount = $expiredQuery->count();

        if ($expiredCount > 0) {
            $this->info("Found {$expiredCount} expired cart(s)");
            if (! $dryRun) {
                $deleted = $expiredQuery->delete();
                $this->info("✓ Deleted {$deleted} expired cart(s)");
            } else {
                $this->warn("  [DRY RUN] Would delete {$expiredCount} expired cart(s)");
            }
        } else {
            $this->info('No expired carts found');
        }

        $this->newLine();

        // 2. Delete old guest carts (carts with session_id, no customer_id)
        $cutoffDate = now()->subDays($guestCartDays);
        $oldGuestCartsQuery = Cart::whereNull('customer_id')
            ->whereNotNull('session_id')
            ->where('updated_at', '<=', $cutoffDate);

        $oldGuestCount = $oldGuestCartsQuery->count();

        if ($oldGuestCount > 0) {
            $this->info("Found {$oldGuestCount} old guest cart(s) (older than {$guestCartDays} days)");
            if (! $dryRun) {
                $deleted = $oldGuestCartsQuery->delete();
                $this->info("✓ Deleted {$deleted} old guest cart(s)");
            } else {
                $this->warn("  [DRY RUN] Would delete {$oldGuestCount} old guest cart(s)");
            }
        } else {
            $this->info("No old guest carts found (older than {$guestCartDays} days)");
        }

        $this->newLine();

        // 3. Delete empty carts (no items)
        $emptyCartsQuery = Cart::whereDoesntHave('items')
            ->where('updated_at', '<=', now()->subDays(7));

        $emptyCount = $emptyCartsQuery->count();

        if ($emptyCount > 0) {
            $this->info("Found {$emptyCount} empty cart(s) (updated >7 days ago)");
            if (! $dryRun) {
                $deleted = $emptyCartsQuery->delete();
                $this->info("✓ Deleted {$deleted} empty cart(s)");
            } else {
                $this->warn("  [DRY RUN] Would delete {$emptyCount} empty cart(s)");
            }
        } else {
            $this->info('No old empty carts found');
        }

        $this->newLine();

        if ($dryRun) {
            $this->warn('DRY RUN MODE: No carts were actually deleted.');
            $this->info('Run without --dry-run to perform the cleanup.');
        } else {
            $totalDeleted = $expiredCount + $oldGuestCount + $emptyCount;
            $this->info("✓ Cleanup complete! Total carts removed: {$totalDeleted}");
        }

        return Command::SUCCESS;
    }
}
