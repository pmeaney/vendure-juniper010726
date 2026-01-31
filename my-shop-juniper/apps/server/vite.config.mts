import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { defineConfig } from 'vite';
import 'dotenv/config';
const IS_DEV = process.env.APP_ENV === 'dev';

export default defineConfig({
    // By default, Vite binds to localhost (127.0.0.1).
    // We need this-- at least for dev.
    // In dev, this Starts dev server with server: { host: '0.0.0.0', port: 5173 }
    // in Prod, the build step of  { outDir: 'dist/dashboard' }  will create static file (no server starts up)
    // So, this should be fine for keeping in both dev & prod, since it won't be used in prod.
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    base: '/dashboard',
    build: {
        outDir: join(__dirname, 'dist/dashboard'),
    },
    plugins: [
        vendureDashboardPlugin({
            // The vendureDashboardPlugin will scan your configuration in order
            // to find any plugins which have dashboard extensions, as well as
            // to introspect the GraphQL schema based on any API extensions
            // and custom fields that are configured.
            vendureConfigPath: pathToFileURL('./src/vendure-config.ts'),
            // Points to the location of your Vendure server.
            api: IS_DEV
              ? {
                  host: 'http://localhost',
                  port: 3000,
                }
              : {
                  host: process.env.VENDURE_API_HOST,
                  // 🚫 NO port in prod.  If you provide port, it will be used.
                  // In production, specifying an API port in the Vite dashboard config forces the
                  // compiled Admin UI to call host:port directly, bypassing the reverse proxy and
                  // causing CORS delays. This change aligns dashboard API config with APP_ENV:
                  // use host + port in dev, and same-origin API paths in prod.
                },
            // When you start the Vite server, your Admin API schema will
            // be introspected and the types will be generated in this location.
            // These types can be used in your dashboard extensions to provide
            // type safety when writing queries and mutations.
            gqlOutputPath: './src/gql',
        }),
    ],
    resolve: {
        alias: {
            // This allows all plugins to reference a shared set of
            // GraphQL types.
            '@/gql': resolve(__dirname, './src/gql/graphql.ts'),
        },
    },
});
