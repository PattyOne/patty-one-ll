import { describe, it, expect } from 'vitest';
import { PROXIMO } from '@/lib/bissemanas';
describe('bissemanas', () => {
  it('clique alterna livre → reservado → ocupado → livre', () => expect(PROXIMO[PROXIMO[PROXIMO.Livre]]).toBe('Livre'));
});
