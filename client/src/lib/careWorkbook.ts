export const careSheetNames = { tapping: "Theo dõi cạo mủ", reinforcement: "Gia cố keo, máng, tấm che", care: "Chăm sóc", treatment: "Phun, bôi thuốc" } as const;
export type CareCategory = keyof typeof careSheetNames;
export function buildCareWorkbookSheets(records: Array<Record<string, unknown>>) {
  return (Object.keys(careSheetNames) as CareCategory[]).flatMap(category => { const rows = records.filter(row => row.category === category); return rows.length ? [{ name: careSheetNames[category], rows }] : []; });
}
