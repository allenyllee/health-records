import './scripts/local-runtime.mjs';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { sites } from './build/sites-vite-plugin';

export default defineConfig(async () => {
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    server: { host: '127.0.0.1' },
    plugins: [
      vinext(),
      // The vendored upstream plugin provides loopback-only mock auth in dev;
      // no mock authentication handler is installed in a production build.
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
        config: {
          main: './build/health-worker.ts',
          compatibility_date: '2026-05-15',
          compatibility_flags: ['nodejs_compat'],
          d1_databases: [{
            binding: 'DB',
            database_name: 'site-creator-d1',
            database_id: '00000000-0000-4000-8000-000000000000',
          }],
        },
      }),
    ],
  };
});
