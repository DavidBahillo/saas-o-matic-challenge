// Hora determinista en los tests (D-P15): formatClock y formatDateTime dependen de TZ.
export default function setup(): void {
  process.env.TZ = 'UTC';
}
