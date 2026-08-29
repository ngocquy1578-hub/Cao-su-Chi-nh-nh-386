export function monthStartDate(year: number, month: number) {
  if (!Number.isInteger(year) || year < 1900 || year > 3000) throw new Error("Năm không hợp lệ");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Tháng không hợp lệ");
  return new Date(Date.UTC(year, month - 1, 1, 12));
}

export function monthYearLabel(value: Date | string) {
  const date = new Date(value);
  return `Tháng ${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}
