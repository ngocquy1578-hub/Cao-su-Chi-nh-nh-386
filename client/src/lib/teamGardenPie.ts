export type TeamGardenPieItem = {
  gardenType: "A" | "B" | "C";
  label: "Vườn A" | "Vườn B" | "Vườn C";
  color: string;
  areaHa: number;
  percent: number;
};

const gardens = [
  { gardenType: "A", label: "Vườn A", color: "#059669" },
  { gardenType: "B", label: "Vườn B", color: "#0284c7" },
  { gardenType: "C", label: "Vườn C", color: "#d97706" },
] as const;

export function buildTeamGardenPieData(areas: Record<"A" | "B" | "C", number>) {
  const totalAreaHa = gardens.reduce((sum, garden) => sum + Number(areas[garden.gardenType] ?? 0), 0);
  return {
    totalAreaHa,
    items: gardens.map(garden => ({
      ...garden,
      areaHa: Number(areas[garden.gardenType] ?? 0),
      percent: totalAreaHa > 0 ? (Number(areas[garden.gardenType] ?? 0) / totalAreaHa) * 100 : 0,
    })),
  };
}
