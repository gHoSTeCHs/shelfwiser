<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\StaffManagementService;
use Inertia\Inertia;
use Inertia\Response;

class StaffManagementController extends Controller
{
    public function __construct(StaffManagementService $staffManagementService)
    {

    }

    public function index(): Response
    {
        return Inertia::render('StaffManagement/Index', []);
    }
}
