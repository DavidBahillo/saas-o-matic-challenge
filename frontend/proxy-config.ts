// Proxy de desarrollo (RF37): /api → backend, quitando el prefijo /api.
export interface ProxyRule {
  target: string;
  changeOrigin: true;
  rewrite: (path: string) => string;
}

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export function createProxyConfig(env: { BACKEND_URL?: string }): Record<string, ProxyRule> {
  const target = env.BACKEND_URL !== undefined && env.BACKEND_URL !== '' ? env.BACKEND_URL : DEFAULT_BACKEND_URL;
  return {
    '/api': { target, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') },
  };
}
