// Hook UserPromptSubmit: guarda prompts en un BUFFER LOCAL (.claude/logs/prompts.jsonl, no versionado).
// Filtra el ruido (confirmaciones, mensajes triviales) y sustituye el contenido pegado por un resumen.
// /log lee este buffer, documenta solo lo importante en ai-workspace/ y lo vacía.
// Nunca bloquea: ante cualquier error sale con código 0 sin modificar el prompt.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_CHARS = 1500;
const MIN_CHARS = 15;
const TRIVIAL = /^(s[ií]|no|ok|vale|venga|adelante|perfecto|gracias|aprobado|correcto|hazlo|sigue|continúa|continua)\b[\s.!¡?¿,]*$/i;
const PASTED = /<pasted_content[^>]*>([\s\S]*?)<\/pasted_content[^>]*>/g;

function clean(prompt) {
  return prompt
    .replace(PASTED, (_m, body) => `[contenido pegado: ${body.trim().length} caracteres]`)
    .replace(/\s+\n/g, '\n')
    .trim();
}

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => resolve(raw));
  });
}

try {
  const input = JSON.parse((await readStdin()) || '{}');
  const prompt = clean(String(input.prompt ?? ''));
  const command = prompt.match(/^\/([\w:-]+)/)?.[1] ?? null;
  const trivial = !command && (prompt.length < MIN_CHARS || TRIVIAL.test(prompt));
  if (prompt && !trivial) {
    const dir = join(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd(), '.claude', 'logs');
    mkdirSync(dir, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      session: String(input.session_id ?? '').slice(0, 8),
      ...(command && { command }),
      prompt: prompt.length > MAX_CHARS ? `${prompt.slice(0, MAX_CHARS)}…[recortado]` : prompt,
    };
    appendFileSync(join(dir, 'prompts.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  }
} catch {
  // Silencioso a propósito: el registro nunca debe interrumpir el trabajo.
}
