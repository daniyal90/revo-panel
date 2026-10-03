export function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  try {
    // Prisma Decimal instances implement toString
    return Number(value.toString());
  } catch (e) {
    return Number(value) || 0;
  }
}

export function numberToDecimalString(value: number | string): string {
  if (typeof value === 'number') return value.toString();
  return String(value);
}
