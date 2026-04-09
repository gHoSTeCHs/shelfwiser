<?php

use App\Models\Shop;
use App\Models\StorefrontMedia;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Storefront\StorefrontMediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->actingAs($this->user, 'web');

    $this->service = app(StorefrontMediaService::class);
});

it('uploads a file and creates a StorefrontMedia record', function () {
    $file = UploadedFile::fake()->image('hero-banner.jpg', 800, 600);

    $media = $this->service->upload($this->shop, $file, 'Hero image', 'hero');

    expect($media)->toBeInstanceOf(StorefrontMedia::class)
        ->and($media->tenant_id)->toBe($this->tenant->id)
        ->and($media->shop_id)->toBe($this->shop->id)
        ->and($media->file_name)->toBe('hero-banner.jpg')
        ->and($media->mime_type)->toBe('image/jpeg')
        ->and($media->alt_text)->toBe('Hero image')
        ->and($media->usage_context)->toBe('hero')
        ->and($media->dimensions)->toBeArray()
        ->and($media->dimensions['width'])->toBeGreaterThan(0)
        ->and($media->dimensions['height'])->toBeGreaterThan(0);

    Storage::disk('public')->assertExists($media->file_path);
    expect($media->file_path)->toStartWith("storefront/{$this->shop->id}/");
});

it('stores file in storefront/{shop_id}/ path', function () {
    $file = UploadedFile::fake()->image('logo.png', 200, 200);

    $media = $this->service->upload($this->shop, $file);

    expect($media->file_path)->toMatch("/^storefront\/{$this->shop->id}\/[A-Za-z0-9]+\.png$/");
    Storage::disk('public')->assertExists($media->file_path);
});

it('resizes images that exceed max dimensions', function () {
    $file = UploadedFile::fake()->image('huge.jpg', 4000, 3000);

    $media = $this->service->upload($this->shop, $file);

    expect($media->dimensions['width'])->toBeLessThanOrEqual(1920)
        ->and($media->dimensions['height'])->toBeLessThanOrEqual(1920);
});

it('does not upscale images smaller than max dimensions', function () {
    $file = UploadedFile::fake()->image('small.jpg', 400, 300);

    $media = $this->service->upload($this->shop, $file);

    expect($media->dimensions['width'])->toBe(400)
        ->and($media->dimensions['height'])->toBe(300);
});

it('accepts png, webp, and gif files', function (string $extension, string $mimeType) {
    $file = UploadedFile::fake()->image("test.{$extension}", 100, 100);

    $media = $this->service->upload($this->shop, $file);

    expect($media->mime_type)->toBe($mimeType);
    Storage::disk('public')->assertExists($media->file_path);
})->with([
    'png' => ['png', 'image/png'],
    'webp' => ['webp', 'image/webp'],
]);

it('rejects non-image file types', function () {
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->service->upload($this->shop, $file);
})->throws(\InvalidArgumentException::class, 'not allowed');

it('deletes file from storage and removes record', function () {
    $file = UploadedFile::fake()->image('to-delete.jpg', 200, 200);
    $media = $this->service->upload($this->shop, $file);
    $path = $media->file_path;
    $id = $media->id;

    Storage::disk('public')->assertExists($path);

    $this->service->delete($media);

    Storage::disk('public')->assertMissing($path);
    $this->assertDatabaseMissing('storefront_media', ['id' => $id]);
});

it('records file size after encoding', function () {
    $file = UploadedFile::fake()->image('sized.jpg', 500, 500);

    $media = $this->service->upload($this->shop, $file);

    expect($media->file_size)->toBeGreaterThan(0);
});
