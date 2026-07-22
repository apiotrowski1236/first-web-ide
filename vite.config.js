import { defineConfig } from 'vite'

// Static, dependency-light build. `base: './'` makes the built app work when
// hosted from a sub-path (GitHub Pages project page) OR from a Neocities folder.
// `target: 'safari15'` keeps output within what the classroom Macs' Safari runs.
export default defineConfig({
  base: './',
  build: {
    target: 'safari15',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
})
