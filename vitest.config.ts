import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig(configEnv => mergeConfig(
  typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    }
  })
))
