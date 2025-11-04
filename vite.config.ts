import { wayfinder } from '@laravel/vite-plugin-wayfinder';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import tailwindcss from "@tailwindcss/vite";
import svgr from 'vite-plugin-svgr';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        svgr({
            svgrOptions: {
                icon: true,
                exportType: 'named',
                namedExport: 'ReactComponent',
            },
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
