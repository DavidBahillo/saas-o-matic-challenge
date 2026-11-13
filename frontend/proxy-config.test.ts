// RF37: el proxy de Vite reenvía /api al backend quitando el prefijo.
import { describe, expect, it } from 'vitest';
import { createProxyConfig } from './proxy-config';

describe('createProxyConfig', () => {
  it('reenvía /api/customers?q=a a /customers?q=a', () => {
    const rule = createProxyConfig({})['/api'];
    expect(rule?.rewrite('/api/customers?q=a')).toBe('/customers?q=a');
  });

  it('usa http://localhost:3000 por defecto', () => {
    expect(createProxyConfig({})['/api']?.target).toBe('http://localhost:3000');
  });

  it('respeta BACKEND_URL', () => {
    const rule = createProxyConfig({ BACKEND_URL: 'http://localhost:4000' })['/api'];
    expect(rule?.target).toBe('http://localhost:4000');
    expect(rule?.changeOrigin).toBe(true);
  });
});
