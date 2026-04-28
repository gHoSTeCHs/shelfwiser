<?php

namespace App\Http\Controllers;

use App\Enums\StorefrontPageType;
use App\Http\Requests\Storefront\AddSectionRequest;
use App\Http\Requests\Storefront\ReorderSectionsRequest;
use App\Http\Requests\Storefront\SelectThemeRequest;
use App\Http\Requests\Storefront\UpdateSectionRequest;
use App\Http\Requests\Storefront\UpdateStorefrontConfigRequest;
use App\Http\Resources\StorefrontConfigResource;
use App\Http\Resources\StorefrontPageResource;
use App\Http\Resources\StorefrontThemeResource;
use App\Models\Shop;
use App\Models\StorefrontPage;
use App\Services\Storefront\SectionTypeRegistry;
use App\Services\Storefront\StorefrontBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontBuilderController extends Controller
{
    public function __construct(
        private readonly StorefrontBuilderService $builderService,
        private readonly SectionTypeRegistry $sectionRegistry,
    ) {}

    public function index(Shop $shop): Response
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig?->loadBuilderRelations();

        return Inertia::render('Admin/Storefront/Builder', [
            'shop' => $shop,
            'config' => $config ? new StorefrontConfigResource($config) : null,
            'themes' => $this->builderService->getActiveThemes()
                ->map(fn ($theme) => (new StorefrontThemeResource($theme))->resolve())
                ->values()
                ->all(),
        ]);
    }

    public function getBuilderData(Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig;

        if (! $config) {
            return response()->json(['config' => null, 'pages' => [], 'sectionManifest' => []]);
        }

        $config->loadBuilderRelations();

        $manifest = $config->theme?->template
            ? $this->sectionRegistry->getBuilderManifest($config->theme->template)
            : [];

        return response()->json([
            'config' => new StorefrontConfigResource($config),
            'pages' => StorefrontPageResource::collection($config->pages),
            'sectionManifest' => $manifest,
        ]);
    }

    public function selectTheme(SelectThemeRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $theme = $this->builderService->findTheme($request->validated('theme_id'));
        abort_unless($theme, 422, 'Selected theme is no longer available.');
        $config = $this->builderService->initializeStorefront($shop, $theme);
        $config->loadBuilderRelations();

        return response()->json([
            'config' => new StorefrontConfigResource($config),
            'message' => 'Storefront initialized successfully.',
        ]);
    }

    public function updateConfig(UpdateStorefrontConfigRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig;
        abort_unless($config, 404, 'Storefront not initialized.');

        $config = $this->builderService->updateStorefrontConfig($config, $request->validated());

        return response()->json([
            'config' => new StorefrontConfigResource($config),
            'message' => 'Configuration updated.',
        ]);
    }

    public function getPage(Shop $shop, string $pageType): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $type = StorefrontPageType::tryFrom($pageType);
        abort_unless($type, 404, 'Invalid page type.');

        $page = $this->builderService->getPageByType($shop, $type);

        return response()->json(['page' => new StorefrontPageResource($page)]);
    }

    public function addSection(AddSectionRequest $request, Shop $shop, string $pageType): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $page = $this->resolvePage($shop, $pageType);

        $sectionType = $this->sectionRegistry->get($request->validated('type'));
        abort_unless($sectionType, 422, "Unknown section type: {$request->validated('type')}");

        $page = $this->builderService->addSectionToPage(
            $page,
            $request->validated('type'),
            $request->validated('variant'),
            $request->validated('position')
        );

        return response()->json([
            'page' => new StorefrontPageResource($page),
            'message' => 'Section added.',
        ]);
    }

    public function updateSection(UpdateSectionRequest $request, Shop $shop, string $pageType, string $sectionId): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);
        $this->validateSectionId($sectionId);

        $page = $this->resolvePage($shop, $pageType);

        try {
            $page = $this->builderService->updateSectionConfig(
                $page,
                $sectionId,
                $request->validated('config'),
                $request->validated('variant')
            );
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'page' => new StorefrontPageResource($page),
            'message' => 'Section updated.',
        ]);
    }

    public function removeSection(Shop $shop, string $pageType, string $sectionId): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);
        $this->validateSectionId($sectionId);

        $page = $this->resolvePage($shop, $pageType);

        try {
            $page = $this->builderService->removeSectionFromPage($page, $sectionId);
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'page' => new StorefrontPageResource($page),
            'message' => 'Section removed.',
        ]);
    }

    public function reorderSections(ReorderSectionsRequest $request, Shop $shop, string $pageType): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $page = $this->resolvePage($shop, $pageType);

        try {
            $page = $this->builderService->reorderSections($page, $request->validated('section_ids'));
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'page' => new StorefrontPageResource($page),
            'message' => 'Sections reordered.',
        ]);
    }

    public function toggleVisibility(Shop $shop, string $pageType, string $sectionId): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);
        $this->validateSectionId($sectionId);

        $page = $this->resolvePage($shop, $pageType);

        try {
            $page = $this->builderService->toggleSectionVisibility($page, $sectionId);
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json([
            'page' => new StorefrontPageResource($page),
            'message' => 'Section visibility toggled.',
        ]);
    }

    public function publish(Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig;
        abort_unless($config, 404, 'Storefront not initialized.');

        $config = $this->builderService->publish($config);

        return response()->json([
            'config' => new StorefrontConfigResource($config),
            'message' => 'Storefront published.',
        ]);
    }

    public function unpublish(Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig;
        abort_unless($config, 404, 'Storefront not initialized.');

        $config = $this->builderService->unpublish($config);

        return response()->json([
            'config' => new StorefrontConfigResource($config),
            'message' => 'Storefront unpublished.',
        ]);
    }

    public function resetToDefaults(Shop $shop): JsonResponse
    {
        Gate::authorize('configureSettings', $shop);

        $config = $shop->storefrontConfig;
        abort_unless($config, 404, 'Storefront not initialized.');

        $config = $this->builderService->resetToThemeDefaults($config);

        return response()->json([
            'config' => new StorefrontConfigResource($config->fresh(['theme.template'])),
            'message' => 'Reset to theme defaults.',
        ]);
    }

    private function resolvePage(Shop $shop, string $pageType): StorefrontPage
    {
        $type = StorefrontPageType::tryFrom($pageType);
        abort_unless($type, 404, 'Invalid page type.');

        $config = $shop->storefrontConfig;
        abort_unless($config, 404, 'Storefront not initialized.');

        return $this->builderService->resolveConfigPage($config, $type);
    }

    private function validateSectionId(string $sectionId): void
    {
        abort_unless(preg_match('/^sec_[a-zA-Z0-9]{12}$/', $sectionId), 422, 'Invalid section ID format.');
    }
}
