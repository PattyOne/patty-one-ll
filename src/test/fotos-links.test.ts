import { describe, it, expect } from 'vitest';
import { FOTO_URL_TTL_SEGUNDOS, FOTO_URL_STALE_MS } from '@/lib/midia';

describe('links curtos das fotos dos pontos', () => {
  it('valem no máximo 5 minutos', () => expect(FOTO_URL_TTL_SEGUNDOS).toBe(300));
  it('são renovados antes de expirar', () => {
    expect(FOTO_URL_STALE_MS).toBeGreaterThan(0);
    expect(FOTO_URL_STALE_MS).toBeLessThan(FOTO_URL_TTL_SEGUNDOS * 1000);
  });
});
