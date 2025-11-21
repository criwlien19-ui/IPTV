import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Permet d'utiliser process.env.API_KEY dans le code client
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});