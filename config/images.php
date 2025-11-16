<?php

return [
    /**
     * Default disk for storing images
     */
    'disk' => env('IMAGE_DISK', 'public'),

    /**
     * Default placeholder image URL
     */
    'placeholder' => env('IMAGE_PLACEHOLDER', 'https://placehold.co/600x400'),

    /**
     * Allowed image MIME types
     */
    'allowed_mime_types' => [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ],

    /**
     * Allowed file extensions
     */
    'allowed_extensions' => [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
    ],

    /**
     * Maximum file size in kilobytes (5MB default)
     */
    'max_file_size' => env('IMAGE_MAX_FILE_SIZE', 5120),

    /**
     * Maximum number of images per model
     */
    'max_images_per_model' => env('IMAGE_MAX_PER_MODEL', 10),

    /**
     * Thumbnail settings
     */
    'thumbnails' => [
        'enabled' => env('IMAGE_THUMBNAILS_ENABLED', false),
        'sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600],
        ],
    ],

    /**
     * Image optimization settings
     */
    'optimization' => [
        'enabled' => env('IMAGE_OPTIMIZATION_ENABLED', false),
        'quality' => env('IMAGE_OPTIMIZATION_QUALITY', 85),
    ],
];
