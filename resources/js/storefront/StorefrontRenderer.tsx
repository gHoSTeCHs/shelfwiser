import { ThemeProvider } from './ThemeProvider';
import { AnimationProvider } from './AnimationProvider';
import { templateLayoutRegistry } from './layouts/registry';
import { sectionRegistry } from './sections/registry';
import { fixedPageRegistry } from './pages/registry';
import type { StorefrontPageData, SectionData } from './types/storefront';

export function StorefrontRenderer(props: StorefrontPageData) {
    const {
        shop,
        template,
        theme,
        sections,
        cart,
        navigation,
        customer,
        fixedPage,
        fixedPageData,
    } = props;
    const Layout = templateLayoutRegistry[template.slug];

    if (!Layout) {
        return <div>Template not found: {template.slug}</div>;
    }

    const layoutProps = { shop, navigation, cart, theme, customer };

    if (fixedPage) {
        const FixedPage = fixedPageRegistry[fixedPage];
        if (!FixedPage) return <div>Page not found: {fixedPage}</div>;
        return (
            <ThemeProvider theme={theme} template={template}>
                <AnimationProvider template={template} animation={theme.animation}>
                    <Layout {...layoutProps}>
                        <FixedPage
                            data={fixedPageData ?? {}}
                            shop={shop}
                            customer={customer}
                            theme={theme}
                        />
                    </Layout>
                </AnimationProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme} template={template}>
            <AnimationProvider template={template} animation={theme.animation}>
                <Layout {...layoutProps}>
                    {(sections ?? [])
                        .filter((s: SectionData) => s.is_visible)
                        .map((section: SectionData) => {
                            const Component = sectionRegistry[section.type];
                            if (!Component) return null;
                            return (
                                <Component
                                    key={section.id}
                                    config={section.config}
                                    variant={section.variant}
                                    data={section.data}
                                    theme={theme}
                                />
                            );
                        })}
                </Layout>
            </AnimationProvider>
        </ThemeProvider>
    );
}
