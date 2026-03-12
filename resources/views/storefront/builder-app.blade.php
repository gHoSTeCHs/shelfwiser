<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $seo['title'] ?? '' }}</title>
    @if(!empty($seo['description']))
        <meta name="description" content="{{ $seo['description'] }}">
    @endif
    @if(!empty($seo['image']))
        <meta property="og:image" content="{{ $seo['image'] }}">
    @endif

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <style>
        :root { {!! $themeStyles !!} }
    </style>

    @vite('resources/js/storefront/app.tsx')
</head>
<body>
    <div id="storefront-root" data-page="{{ json_encode($pageData, JSON_THROW_ON_ERROR) }}"></div>
</body>
</html>
