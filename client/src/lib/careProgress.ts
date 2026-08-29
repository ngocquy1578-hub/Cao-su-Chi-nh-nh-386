export function calculateCareCompletionPercent(planQuantity: string, actualQuantity: string) {
  const plan = Number(planQuantity) || 0;
  const actual = Number(actualQuantity) || 0;
  if (plan <= 0) return 0;
  return Number(((actual / plan) * 100).toFixed(2));
}
