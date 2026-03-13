import type { SectionProps } from '../types/storefront';
import { HeroBannerSection } from './HeroBannerSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { ProductGridSection } from './ProductGridSection';
import { CategoryGridSection } from './CategoryGridSection';
import { RichTextSection } from './RichTextSection';
import { ImageWithTextSection } from './ImageWithTextSection';
import { TestimonialsSection } from './TestimonialsSection';
import { AnnouncementBarSection } from './AnnouncementBarSection';
import { NewsletterSignupSection } from './NewsletterSignupSection';
import { BannerSection } from './BannerSection';
import { SpacerSection } from './SpacerSection';
import { GallerySection } from './GallerySection';
import { VideoSection } from './VideoSection';
import { FaqSection } from './FaqSection';
import { ContactFormSection } from './ContactFormSection';
import { LogoCloudSection } from './LogoCloudSection';
import { CountdownSection } from './CountdownSection';
import { CollectionListSection } from './CollectionListSection';
import { RecentlyViewedSection } from './RecentlyViewedSection';
import { MapSection } from './MapSection';

export const sectionRegistry: Record<string, React.FC<SectionProps>> = {
    hero_banner: HeroBannerSection,
    featured_products: FeaturedProductsSection,
    product_grid: ProductGridSection,
    category_grid: CategoryGridSection,
    rich_text: RichTextSection,
    image_with_text: ImageWithTextSection,
    testimonials: TestimonialsSection,
    announcement_bar: AnnouncementBarSection,
    newsletter_signup: NewsletterSignupSection,
    banner: BannerSection,
    spacer: SpacerSection,
    gallery: GallerySection,
    video: VideoSection,
    faq: FaqSection,
    contact_form: ContactFormSection,
    logo_cloud: LogoCloudSection,
    countdown: CountdownSection,
    collection_list: CollectionListSection,
    recently_viewed: RecentlyViewedSection,
    map: MapSection,
};
