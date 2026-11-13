export function simulationsLabel(count: number): string {
  return count === 1 ? '1 simulación' : `${String(count)} simulaciones`;
}
