import { describe, it, expect } from 'vitest';
import { parseCoord } from '@/lib/midia';
describe('parseCoord', () => {
  it('aceita vírgula decimal', () => expect(parseCoord('-23,550520', 'lat')).toBe(-23.55052));
  it('vazio vira null', () => expect(parseCoord('  ', 'lng')).toBeNull());
  it('rejeita latitude acima de 90', () => expect(parseCoord('91', 'lat')).toBe('invalido'));
  it('aceita longitude até 180', () => expect(parseCoord('-180', 'lng')).toBe(-180));
});
