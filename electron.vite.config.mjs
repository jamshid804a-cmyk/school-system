import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Chrome 108 (Electron 22) does not understand "in oklab" inside gradients,
// so the gradient is dropped. Remove it and the browser uses normal colors.
const oldChromeCss = () => ({
  name: 'old-chrome-css',
  enforce: 'post',
  transform(code, id) {
    if (!/\.css($|\?)/.test(id)) return null
    const fixed = code.replace(/(\s)in\s+(?:oklab|oklch|srgb|lab|lch)(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?(?=\s*[;,)\\"'])/g, '')
    return fixed === code ? null : { code: fixed, map: null }
  },
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'asset' && String(file.fileName).endsWith('.css')) {
        file.source = String(file.source).replace(/(\s)in\s+(?:oklab|oklch|srgb|lab|lch)(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?(?=\s*[;,)])/g, '')
      }
    }
  }
})

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss(), oldChromeCss()],
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: { chrome: 108 << 16 }
      }
    },
    build: {
      target: 'chrome108',
      cssMinify: 'lightningcss'
    }
  }
})