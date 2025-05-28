export function randomBetween(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.random() * (max - min) + min;
}