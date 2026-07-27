/** Line tax: total = base + (base × ratePercent / 100) */
export function computeLineAmounts(quantity: number, unitAmountMinor: number, ratePercent: number) {
  const baseMinor = Math.round(quantity * unitAmountMinor);
  const rate = Number.isFinite(ratePercent) ? Math.max(0, ratePercent) : 0;
  const taxMinor = Math.round((baseMinor * rate) / 100);
  return {
    baseMinor,
    taxRatePercent: rate,
    taxMinor,
    lineTotalMinor: baseMinor + taxMinor,
  };
}
