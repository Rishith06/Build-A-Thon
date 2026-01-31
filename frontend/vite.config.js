import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix for react-qr-scanner issues
      '@babel/runtime/helpers/extends': path.resolve(__dirname, './node_modules/@babel/runtime/helpers/esm/extends.js'),
      '@babel/runtime/helpers/defineProperty': path.resolve(__dirname, './node_modules/@babel/runtime/helpers/esm/defineProperty.js'),
      '@babel/runtime/helpers/slicedToArray': path.resolve(__dirname, './node_modules/@babel/runtime/helpers/esm/slicedToArray.js'),
      '@babel/runtime/helpers/objectWithoutProperties': path.resolve(__dirname, './node_modules/@babel/runtime/helpers/esm/objectWithoutProperties.js'),
    }
  },
  optimizeDeps: {
    include: ['react-qr-scanner']
  },
  // server: {
  //   host: true,
  //   allowedHosts: [
  //     'waters-annotated-mandatory-sometimes.trycloudflare.com'
  //   ]
  // }
})

