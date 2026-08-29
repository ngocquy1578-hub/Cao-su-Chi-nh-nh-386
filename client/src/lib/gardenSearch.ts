export type GardenSearchOption = {
  name: string;
  plantedYear?: number | null;
};

const searchableText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi-VN").trim();

export function filterGardenOptions<T extends GardenSearchOption>(options: T[], query: string) {
  const normalizedQuery = searchableText(query);
  if (!normalizedQuery) return options;
  return options.filter(option => searchableText(`${option.name} ${option.plantedYear ?? ""}`).includes(normalizedQuery));
}
