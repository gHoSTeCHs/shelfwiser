# ShelfWise Homepage Design

## Overview

Replace the default Laravel `welcome.tsx` with a full SaaS landing page. Single scrollable page targeting both new visitors (education) and warm prospects (conversion). Refined, subtle animation style (Stripe/Linear aesthetic). Full dark mode support throughout.

## Design System

- Font: Outfit (already configured)
- Primary: brand-500 (#465fff)
- Grounding: navy palette
- Accent: gold (accent-400/500)
- Dark mode: full support, all images/mockups swap variants

## Sections

### 1. Navigation Bar
- Sticky, transparent on load, frosted-glass (`backdrop-blur`) on scroll
- Left: ShelfWise logo
- Center/Right: Features, How It Works, Pricing, Testimonials (smooth-scroll anchors)
- Far Right: Dark mode toggle, "Log In" text link, "Get Started Free" brand-500 button
- Scroll-spy highlights active section link
- CTA: soft scale + shadow lift on hover

### 2. Hero
- Full viewport height, two layers
- **Background:** Gradient mesh (brand-500, navy-900, brand-950), 3-5 floating geometric shapes with slow drift animation, faint dot-grid overlay. Dark mode: deeper gradients, more luminous shapes
- **Content (left on desktop, stacked on mobile):**
  - Eyebrow pill badge with shimmer: "Trusted by 500+ businesses across Nigeria"
  - Headline (title-2xl / title-lg mobile): "Manage Your Entire Business From One Platform"
  - Subheadline (gray-500): inventory, POS, payroll, e-commerce pitch
  - Two CTAs: "Get Started Free" (solid) + "See How It Works" (outline, scrolls down)
  - Social proof: overlapping avatars + "Join 500+ business owners"
- **Device mockups (right on desktop, below on mobile):**
  - Laptop (dashboard), tablet (POS), phone (storefront) at 3D perspective tilts
  - Parallax on scroll, staggered float-in entrance
  - Images swap for dark mode
  - Mobile: single dashboard mockup only

### 3. Social Proof / Stats Bar
- Subtle background shift (gray-50 / navy-950)
- 4 counters: "500+ Businesses", "10,000+ Products Managed", "50M+ Sales Processed", "98% Uptime"
- Count-up animation on scroll-enter (Intersection Observer, runs once)
- Staggered by ~150ms, labels fade up
- Desktop: horizontal row with dividers. Mobile: 2x2 grid

### 4. Features Showcase
- Centered heading, 3-column grid (2 tablet, 1 mobile), 6 cards
- Cards: Inventory, POS, Payroll & HR, E-commerce, Supplier & B2B, Reports
- Card design: white/navy-900, rounded-xl, icon in brand-50 circle, title, 2-line description
- Scroll-reveal: fade up with ~100ms stagger
- Hover: translateY(-4px), shadow deepen, icon circle scales up. 300ms ease-out

### 5. How It Works
- 3 steps horizontal (vertical on mobile): Sign Up, Set Up Your Shop, Start Selling
- Numbered circles in brand-500 with ring glow
- Animated connecting line (stroke-dashoffset) draws as section scrolls in
- Steps fade in and scale up as line reaches them

### 6. Pricing
- Monthly/annual toggle (pill-shaped, "Save 20%" gold badge on annual)
- 3 tiers: Starter, Professional (popular), Enterprise
- Popular card: scale-105, brand-500 border, gold "Most Popular" badge, shimmer border
- Feature lists with brand-500 checkmarks
- Cards fade up with stagger, hover lift
- Price numbers animate on toggle switch

### 7. Testimonials
- Auto-scrolling horizontal carousel, infinite loop (CSS animation on duplicated cards)
- Two rows scrolling opposite directions
- Pause on hover, fade-out edge masks
- Cards: white/navy-900, quote text, avatar + name + role, 5-star gold rating
- Mobile: single row

### 8. Final CTA
- Full-width gradient (brand-600 to brand-800, dark: navy-900 to brand-950)
- Centered: headline, subheadline, white CTA button, "No credit card" note
- Dot-grid overlay, 1-2 floating shapes matching hero

### 9. Footer
- Dark background (gray-900 / navy-950)
- 4 columns: Brand + tagline + socials, Product links, Company links, Legal links
- Bottom bar: divider + copyright
- Link hover: underline slide-in. Social icons: scale + color shift

## Animation Philosophy

- Scroll-triggered reveals via Intersection Observer (staggered, directional)
- Subtle hover micro-interactions on all interactive elements
- Counter animations for statistics
- Parallax layers in hero for depth
- All animations respect `prefers-reduced-motion`
- No heavy animation libraries — CSS animations + minimal JS

## Tech Approach

- Single React page component: `resources/js/pages/welcome.tsx` (replace existing)
- Custom hooks: `useScrollReveal`, `useCountUp`, `useScrollSpy`
- No external animation library — CSS keyframes + Intersection Observer
- Responsive: mobile-first approach
- Images: static mockup PNGs in `public/images/homepage/` (light + dark variants)
