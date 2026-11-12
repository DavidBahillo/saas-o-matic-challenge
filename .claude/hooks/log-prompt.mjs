// Hook UserPromptSubmit: añade cada prompt del usuario a ai-workspace/prompts-log.jsonl.
// No bloquea nunca: ante cualquier error sale con código 0 sin modificar el prompt.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_CHARS = 4000;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const prompt = String(input.prompt ?? '').trim();
    if (!prompt) return;
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const dir = join(root, 'ai-workspace');
    mkdirSync(dir, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      session: String(input.session_id ?? '').slice(0, 8),
      prompt: prompt.length > MAX_CHARS ? `${prompt.slice(0, MAX_CHARS)}…[recortado]` : prompt,
    };
    appendFileSync(join(dir, 'prompts-log.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    // Silencioso a propósito: el registro nunca debe interrumpir el trabajo.
  }
});
