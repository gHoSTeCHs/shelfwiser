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

    @vite(['resources/css/storefront.css', 'resources/js/storefront/app.tsx'])
</head>
<body>
    <div id="storefront-root"></div>
    <script>
        window.__STOREFRONT_PAGE__ = {!! Js::from($pageData) !!};
        (function() {
            var styles = {!! Js::from($themeStyleVars) !!};
            var root = document.documentElement;
            for (var key in styles) {
                if (styles.hasOwnProperty(key)) {
                    root.style.setProperty(key, styles[key]);
                }
            }
        })();
    </script>
</body>
</html>
