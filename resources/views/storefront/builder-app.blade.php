<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $seo['title'] ?? '' }}</title>
    @if(!empty($seo['description']))
        <meta name="description" content="{{ $seo['description'] }}">
    @endif

    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $seo['title'] ?? '' }}">
    @if(!empty($seo['description']))
        <meta property="og:description" content="{{ $seo['description'] }}">
    @endif
    @if(!empty($seo['image']))
        <meta property="og:image" content="{{ $seo['image'] }}">
    @endif
    <meta property="og:url" content="{{ url()->current() }}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seo['title'] ?? '' }}">
    @if(!empty($seo['description']))
        <meta name="twitter:description" content="{{ $seo['description'] }}">
    @endif
    @if(!empty($seo['image']))
        <meta name="twitter:image" content="{{ $seo['image'] }}">
    @endif

    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Prevent dark mode flash: set bg/color before any paint --}}
    <script>
        (function() {
            var params = new URLSearchParams(window.location.search);
            var strategy = {!! Js::from($pageData['theme']['dark_mode_strategy'] ?? 'system') !!};
            var d = false;

            if (params.get('force_dark') === '1') {
                d = true;
            } else if (strategy === 'dark') {
                d = true;
            } else if (strategy === 'light') {
                d = false;
            } else if (strategy === 'toggle') {
                var m = localStorage.getItem('storefront-color-mode');
                d = m === 'dark' || (!m && window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                d = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            document.documentElement.style.colorScheme = d ? 'dark' : 'light';
            document.documentElement.setAttribute('data-mode', d ? 'dark' : 'light');
        })();
    </script>
    <style>
        html[data-mode="dark"] body { background: {{ $pageData['theme']['colors_dark']['background'] ?? '#0f1117' }}; color: {{ $pageData['theme']['colors_dark']['foreground'] ?? '#f0f0f2' }}; }
        html[data-mode="light"] body { background: {{ $pageData['theme']['colors']['background'] ?? '#ffffff' }}; color: {{ $pageData['theme']['colors']['foreground'] ?? '#111827' }}; }
    </style>

    @viteReactRefresh
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
