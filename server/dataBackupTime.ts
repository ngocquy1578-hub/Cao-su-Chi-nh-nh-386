const vietnamParts = (value: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(value);
  return Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
};

export function getVietnamBackupDateKey(value = new Date()) {
  const parts = vietnamParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isVietnamSunday(value = new Date()) {
  return vietnamParts(value).weekday === "Sun";
}
