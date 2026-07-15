import vinext from 'vinext'
import { defineConfig } from 'vite'
import hostingConfig from './.openai/hosting.json'
import { sites } from './build/sites-vite-plugin'

const placeholderDatabaseId = '00000000-0000-4000-8000-000000000000'
const { d1, r2 } = hostingConfig

export default defineConfig(async ({ mode }) => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false'
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs'
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry'
  const productionPlugins = []
  if (mode !== 'local') {
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    productionPlugins.push(
      sites(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: {
          main: './worker/index.ts',
          compatibility_flags: ['nodejs_compat'],
          d1_databases: d1 ? [{ binding: d1, database_name: 'haru-planner-d1', database_id: placeholderDatabaseId }] : [],
          r2_buckets: r2 ? [{ binding: r2, bucket_name: 'haru-planner-r2' }] : [],
        },
      }),
    )
  }

  return {
    plugins: [
      vinext(),
      ...productionPlugins,
    ],
  }
})
