<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShelfWise Storefront Theme Catalog</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'DM Sans', sans-serif;
            background: #f8f9fb;
            color: #111;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        .hero {
            background: #111;
            color: #fff;
            padding: 80px 24px 60px;
            text-align: center;
        }
        .hero h1 {
            font-family: 'Outfit', sans-serif;
            font-size: clamp(2rem, 5vw, 3.5rem);
            font-weight: 800;
            letter-spacing: -0.04em;
            line-height: 1.1;
        }
        .hero p {
            margin-top: 16px;
            font-size: 17px;
            color: rgba(255,255,255,0.55);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .hero .stats {
            display: flex;
            justify-content: center;
            gap: 48px;
            margin-top: 40px;
        }
        .hero .stat-value {
            font-family: 'Outfit', sans-serif;
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -0.03em;
        }
        .hero .stat-label {
            font-size: 13px;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-top: 4px;
        }

        .container {
            max-width: 1320px;
            margin: 0 auto;
            padding: 0 24px;
        }

        .template-section {
            padding: 64px 0 48px;
            border-bottom: 1px solid #e5e7eb;
        }
        .template-section:last-child {
            border-bottom: none;
        }

        .template-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 36px;
            flex-wrap: wrap;
        }
        .template-name {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.03em;
        }
        .template-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-radius: 999px;
        }
        .badge-category { background: #e0f2fe; color: #0369a1; }
        .badge-animation { background: #fef3c7; color: #92400e; }
        .badge-premium { background: #fce7f3; color: #be185d; }
        .template-desc {
            font-size: 15px;
            color: #6b7280;
            max-width: 720px;
            line-height: 1.65;
            margin-bottom: 8px;
        }
        .template-best-for {
            font-size: 13px;
            color: #9ca3af;
        }
        .template-best-for strong { color: #6b7280; }

        .themes-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 20px;
        }
        @media (min-width: 640px) { .themes-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .themes-grid { grid-template-columns: repeat(3, 1fr); } }

        .theme-card {
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            background: #fff;
            transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .theme-card:hover {
            box-shadow: 0 12px 40px -12px rgba(0,0,0,0.12);
            transform: translateY(-4px);
        }

        .theme-preview {
            height: 140px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .theme-preview-text {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.03em;
            z-index: 1;
            text-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .theme-body {
            padding: 20px 22px 22px;
        }
        .theme-name {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #111;
        }
        .theme-mood {
            font-size: 13px;
            color: #6b7280;
            margin-top: 3px;
            font-style: italic;
        }

        .theme-swatches {
            display: flex;
            gap: 8px;
            margin-top: 14px;
        }
        .swatch {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid rgba(0,0,0,0.06);
            flex-shrink: 0;
        }

        .theme-details {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .theme-detail {
            font-size: 12px;
            color: #9ca3af;
        }
        .theme-detail strong {
            color: #6b7280;
            font-weight: 600;
        }

        .footer {
            padding: 40px 24px;
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
        }

        .toc {
            padding: 32px 0;
            background: #fff;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .toc-list {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 0 24px;
            max-width: 1320px;
            margin: 0 auto;
            scrollbar-width: none;
        }
        .toc-list::-webkit-scrollbar { display: none; }
        .toc-link {
            display: inline-block;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-decoration: none;
            white-space: nowrap;
            border-radius: 999px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
        }
        .toc-link:hover {
            background: #111;
            color: #fff;
            border-color: #111;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Storefront Theme Catalog</h1>
        <p>15 templates, 90 themes. Every shop on ShelfWise gets a storefront that looks and feels custom-built.</p>
        <div class="stats">
            <div>
                <div class="stat-value">15</div>
                <div class="stat-label">Templates</div>
            </div>
            <div>
                <div class="stat-value">90</div>
                <div class="stat-label">Themes</div>
            </div>
            <div>
                <div class="stat-value">6</div>
                <div class="stat-label">Per Template</div>
            </div>
        </div>
    </div>

    <nav class="toc">
        <div class="toc-list">
            @foreach($templates as $i => $tpl)
                <a href="#template-{{ $i + 1 }}" class="toc-link">{{ $tpl['name'] }}</a>
            @endforeach
        </div>
    </nav>

    <div class="container">
        @foreach($templates as $i => $tpl)
        <section id="template-{{ $i + 1 }}" class="template-section">
            <div class="template-header">
                <div>
                    <h2 class="template-name">{{ $i + 1 }}. {{ $tpl['name'] }}</h2>
                    <div class="template-meta" style="margin-top: 10px;">
                        <span class="badge badge-category">{{ $tpl['category'] }}</span>
                        <span class="badge badge-animation">{{ $tpl['animation'] }}</span>
                        @if($tpl['premium'] ?? false)
                            <span class="badge badge-premium">Premium</span>
                        @endif
                    </div>
                </div>
            </div>
            <p class="template-desc">{{ $tpl['description'] }}</p>
            <p class="template-best-for"><strong>Best for:</strong> {{ $tpl['best_for'] }}</p>

            <div class="themes-grid" style="margin-top: 28px;">
                @foreach($tpl['themes'] as $theme)
                <div class="theme-card">
                    <div class="theme-preview" style="background: {{ $theme['bg'] }};">
                        <span class="theme-preview-text" style="color: {{ $theme['text'] }}; font-family: {{ $theme['font_display'] }}, sans-serif;">
                            {{ $theme['name'] }}
                        </span>
                        @if($theme['accent'] !== 'none')
                        <div style="position:absolute;bottom:0;right:0;width:60%;height:40%;background:{{ $theme['accent'] }};opacity:0.15;border-radius:80px 0 0 0;"></div>
                        @endif
                    </div>
                    <div class="theme-body">
                        <div class="theme-name">{{ $theme['name'] }}</div>
                        <div class="theme-mood">{{ $theme['mood'] }}</div>
                        <div class="theme-swatches">
                            <div class="swatch" style="background: {{ $theme['bg'] }};" title="Background"></div>
                            <div class="swatch" style="background: {{ $theme['text'] }};" title="Text"></div>
                            @if($theme['accent'] !== 'none')
                            <div class="swatch" style="background: {{ $theme['accent'] }};" title="Accent"></div>
                            @endif
                            @if(isset($theme['accent2']))
                            <div class="swatch" style="background: {{ $theme['accent2'] }};" title="Accent 2"></div>
                            @endif
                        </div>
                        <div class="theme-details">
                            <div class="theme-detail"><strong>Typography:</strong> {{ $theme['typography'] }}</div>
                            <div class="theme-detail"><strong>Cards:</strong> {{ $theme['card_style'] }}</div>
                            <div class="theme-detail"><strong>Best for:</strong> {{ $theme['best_for'] }}</div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </section>
        @endforeach
    </div>

    <div class="footer">
        ShelfWise Storefront Theme Catalog &mdash; Dev Reference
    </div>
</body>
</html>
