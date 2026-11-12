// Hook PostToolUse (Skill | Agent | Task): registra qué skills y subagentes usa la IA
// en el buffer local .claude/logs/activity.jsonl (no versionado). /log lo resume en el journal.
// Nunca bloquea: ante cualquier error sale con código 0.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (raw += c));
    process.stdin.on('end', () => resolve(raw));
  });
}

function describe(tool, input) {
  if (tool === 'Skill') return { kind: 'skill', name: input.skill, detail: input.args };
  return { kind: 'subagent', name: input.subagent_type || 'general-purpose', detail: input.description };
}

try {
  const input = JSON.parse((await readStdin()) || '{}');
  const tool = input.tool_name;
  if (['Skill', 'Agent', 'Task'].includes(tool)) {
    const { kind, name, detail } = describe(tool, input.tool_input ?? {});
    const dir = join(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd(), '.claude', 'logs');
    mkdirSync(dir, { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      session: String(input.session_id ?? '').slice(0, 8),
      kind,
      name,
      ...(detail && { detail: String(detail).slice(0, 200) }),
    };
    appendFileSync(join(dir, 'activity.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  }
} catch {
  // Silencioso a propósito.
}
