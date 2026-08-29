export const STANDARD_PERIODS = ["Đợt 1", "Đợt 2", "Đợt 3"] as const;
export const DEFAULT_PERIOD = STANDARD_PERIODS[0];
export const periodOptions = (existing: readonly string[] | undefined | null = []) => Array.from(new Set<string>([...STANDARD_PERIODS, ...(existing ?? []).filter(Boolean)]));
export const currentPeriod = () => DEFAULT_PERIOD;

export const formatQuantity = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Number(value ?? 0));

export const formatAreaHa = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value ?? 0));

export const formatPercent = (value: number | null | undefined) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(value ?? 0))}%`;

export const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

export const toDateInput = (value = new Date()) => new Date(value).toISOString().slice(0, 10);

export const downloadFile = (filename: string, content: BlobPart, type: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
};
