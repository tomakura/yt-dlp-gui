import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import path from 'path'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const electronBinary = require('electron') as string
let electronProcess: ChildProcessWithoutNullStreams | null = null

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const electronPlugins = await electron({
    main: {
      entry: 'electron/main.ts',
      vite: {
        build: {
          rollupOptions: {
            external: ['ffmpeg-static', 'yt-dlp-exec'],
          },
        },
      },
      onstart() {
        if (electronProcess) {
          electronProcess.kill()
          electronProcess = null
        }

        const env = { ...process.env }
        delete env.ELECTRON_RUN_AS_NODE

        electronProcess = spawn(electronBinary, [path.join(__dirname, 'dist-electron/main.js')], {
          stdio: 'inherit',
          env,
        })
      },
    },
    preload: {
      input: path.join(__dirname, 'electron/preload.ts'),
      onstart({ reload }) {
        reload()
      },
    },
  })

  return {
    plugins: [
      react(),
      ...electronPlugins,
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
