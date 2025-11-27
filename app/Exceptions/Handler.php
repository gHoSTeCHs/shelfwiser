<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (TenantLimitExceededException $e, $request) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        });
    }

    /**
     * Prepare exception for rendering.
     */
    protected function prepareException(Throwable $e): Throwable
    {
        return $e;
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @throws Throwable
     */
    public function render($request, Throwable $e): JsonResponse|Response
    {
        $response = parent::render($request, $e);
        $status = $response->getStatusCode();

        // Only handle Inertia requests
        if (! $request->inertia()) {
            return $response;
        }

        // Map status codes to React components
        return match ($status) {
            404 => Inertia::render('Error404')->toResponse($request)->setStatusCode($status),
            403 => Inertia::render('Error403')->toResponse($request)->setStatusCode($status),
            500 => Inertia::render('Error500')->toResponse($request)->setStatusCode($status),
            503 => Inertia::render('Error503')->toResponse($request)->setStatusCode($status),
            default => Inertia::render('Error', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status),
        };
    }
}
