// @vitest-environment node
/**
 * Integração com o backend real: roda apenas quando há sessão de teste
 * (arquivo ~/.cache/lovable-auth/session.json ou FOTOS_TEST_SESSION_FILE).
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const file = process.env['FOTOS_TEST_SESSION_FILE'] ?? `${homedir()}/.cache/lovable-auth/session.json`;
const env = existsSync('.env') ? Object.fromEntries(readFileSync('.env', 'utf8').split('\n')
  .map(l => l.match(/^(\w+)="?([^"]*)"?$/)).filter(Boolean).map(m => [m![1], m![2]])) : {};
const url = env['VITE_SUPABASE_URL'], key = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const pronto = existsSync(file) && !!url && !!key;

describe.skipIf(!pronto)('fotos dos pontos no backend', () => {
  async function cliente() {
    const { session } = JSON.parse(readFileSync(file, 'utf8'));
    const sb = createClient(url!, key!, { auth: { persistSession: false } });
    await sb.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    return { sb, userId: session.user.id as string };
  }

  it('grava quem enviou a foto como autor', async () => {
    const { sb, userId } = await cliente();
    const path = `teste-autoria/${crypto.randomUUID()}.txt`;
    const up = await sb.storage.from('pontos-midia').upload(path, new Blob(['x'], { type: 'text/plain' }));
    expect(up.error).toBeNull();
    try {
      const info = await sb.storage.from('pontos-midia').info(path);
      expect(info.error).toBeNull();
      const id = (info.data as { id: string }).id;
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      // Conferência no banco (somente leitura) do autor gravado na foto.
      const out = execSync(`lovable supabase query "select owner_id from storage.objects where id = '${id}'"`, { encoding: 'utf8' });
      expect(JSON.parse(out)[0].owner_id).toBe(userId);
    } finally {
      await sb.storage.from('pontos-midia').remove([path]);
    }
  }, 30000);

  it('link curto deixa de funcionar depois de expirar', async () => {
    const { sb } = await cliente();
    const path = `teste-autoria/${crypto.randomUUID()}.txt`;
    expect((await sb.storage.from('pontos-midia').upload(path, new Blob(['x']))).error).toBeNull();
    try {
      const s = await sb.storage.from('pontos-midia').createSignedUrl(path, 2);
      expect(s.error).toBeNull();
      expect((await fetch(s.data!.signedUrl)).status).toBe(200);
      await new Promise(r => setTimeout(r, 4000));
      expect((await fetch(s.data!.signedUrl)).ok).toBe(false);
    } finally {
      await sb.storage.from('pontos-midia').remove([path]);
    }
  }, 30000);
});
