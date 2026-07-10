export const DEPOSIT_PERCENT = 50;

export function depositDueCents(
  totalCents: number,
  percent = DEPOSIT_PERCENT
): number {
  return Math.round(totalCents * (percent / 100));
}

export function balanceDueCents(
  totalCents: number,
  percent = DEPOSIT_PERCENT
): number {
  return totalCents - depositDueCents(totalCents, percent);
}

export function paymentBreakdown(
  totalCents: number,
  percent = DEPOSIT_PERCENT
) {
  const depositCents = depositDueCents(totalCents, percent);
  return {
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
    depositPercent: percent,
  };
}
