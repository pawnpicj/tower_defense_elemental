import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({server:{watch:{usePolling:true,interval:150}},build:{rollupOptions:{input:{battlefield:fileURLToPath(new URL('./index.html',import.meta.url)),database:fileURLToPath(new URL('./database.html',import.meta.url))}}}});
