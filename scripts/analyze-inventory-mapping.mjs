import fs from "node:fs";
import mysql from "mysql2/promise";
import XLSX from "xlsx";

const sourcePath = "/home/ubuntu/upload/THCHUNGKIỂMKÊCSKD-CPC.xlsx";
const workbook = XLSX.readFile(sourcePath, { cellFormula: false, cellNF: false, cellText: false });
const sheet = workbook.Sheets["Chi tiết KK CSKD tại Campuchia"];
const sourceRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }).slice(5);
const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
const integer = value => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.trunc(parsed) : null; };
const normalizePlotName = value => clean(value).replace(/^lô\s*/i, "").replace(/\s*\(\d{4}\)\s*$/i, "").replaceAll(" ", "").toUpperCase();
const inventory = sourceRows.map((values, offset) => ({
  sourceRow: offset + 6, unit: clean(values[1]), plotName: clean(values[2]), plantedYear: integer(values[3]), cultivar: clean(values[4]), areaHa: values[5], totalPits: values[6], totalTrees: values[7], tappingTrees: values[8], immatureTrees: values[10], nonproductiveTrees: values[12], diseasedTrees: values[14], dryTappingTrees: values[16], emptyPits: values[18], tappingDensity: values[19], plotRank: clean(values[20]),
})).filter(row => row.unit.startsWith("Đội") && row.plotName && row.plantedYear);
const db = await mysql.createConnection(process.env.DATABASE_URL);
const [plots] = await db.query("SELECT id, unit, code, name, plantedYear FROM plantation_plots ORDER BY unit, plantedYear, name");
await db.end();
const byName = new Map(plots.map(plot => [`${plot.unit}::${integer(plot.plantedYear)}::${normalizePlotName(plot.name)}`, plot]));
const byCode = new Map(plots.map(plot => [`${plot.unit}::${plot.plantedYear}::${clean(plot.code)}`, plot]));
const matches = [], unmatched = [];
for (const row of inventory) {
  const key = `${row.unit}::${row.plantedYear}::${normalizePlotName(row.plotName)}`;
  const plot = byName.get(key) ?? byCode.get(key);
  if (plot) matches.push({ ...row, systemCode: plot.code, systemName: clean(plot.name) }); else unmatched.push(row);
}
const result = { sourceRows: inventory.length, systemPlots: plots.length, matched: matches.length, unmatched: unmatched.length, units: Object.fromEntries(Array.from(new Set(inventory.map(row => row.unit))).sort().map(unit => [unit, inventory.filter(row => row.unit === unit).length])), matchPreview: matches.slice(0, 10), unmatchedPreview: unmatched.slice(0, 25) };
fs.writeFileSync("/home/ubuntu/inventory_mapping.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify({ sourceRows: result.sourceRows, matched: result.matched, unmatched: result.unmatched }));
