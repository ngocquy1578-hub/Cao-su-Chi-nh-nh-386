export type WorkerPlotAllocationRow = { unit: string; workerName: string; employeeCode: string | null; gardenType: "A" | "B" | "C"; plotCode: string; rowStart: number; rowEnd: number; areaHa: number };

const text = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const number = (value: unknown) => {
  if (typeof value === "number") return value;
  const raw = text(value);
  return Number(raw.includes(",") ? raw.replaceAll(".", "").replace(",", ".") : raw);
};
const slots = [{ gardenType: "A" as const, start: 4 }, { gardenType: "B" as const, start: 10 }, { gardenType: "C" as const, start: 16 }];

export function parseWorkerPlotAllocationRows(rows: unknown[][]) {
  const parsed: WorkerPlotAllocationRow[] = []; const issues: string[] = [];
  rows.slice(2).forEach((row, index) => {
    const sheetRow = index + 3; const unit = text(row[1]); const workerName = text(row[2]); const employeeCode = text(row[3]) || null;
    slots.forEach(slot => {
      const plotCode = text(row[slot.start]); const rowStart = number(row[slot.start + 3]); const rowEnd = number(row[slot.start + 4]); const areaHa = number(row[slot.start + 5]);
      const hasValue = [plotCode, row[slot.start + 3], row[slot.start + 4], row[slot.start + 5]].some(value => text(value));
      if (!hasValue) return;
      if (!unit || !workerName || !plotCode || !Number.isInteger(rowStart) || !Number.isInteger(rowEnd) || !Number.isFinite(areaHa) || areaHa <= 0) { issues.push(`Dòng ${sheetRow} – Vườn ${slot.gardenType}: cần đủ Đội, Nhân công, Mã lô, Từ hàng, Đến hàng và Diện tích > 0`); return; }
      if (rowStart > rowEnd) { issues.push(`Dòng ${sheetRow} – Vườn ${slot.gardenType}: Từ hàng phải nhỏ hơn hoặc bằng Đến hàng`); return; }
      parsed.push({ unit, workerName, employeeCode, gardenType: slot.gardenType, plotCode, rowStart, rowEnd, areaHa });
    });
  });
  return { parsed, issues };
}
