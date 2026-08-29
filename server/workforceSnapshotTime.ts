const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function vietnamDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: VIETNAM_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return { year: lookup("year"), month: lookup("month"), day: lookup("day") };
}

export function getVietnamMonthKey(date = new Date()) {
  const { year, month } = vietnamDateParts(date);
  return `${year}-${month}`;
}

export function isFirstDayOfVietnamMonth(date = new Date()) {
  return vietnamDateParts(date).day === "01";
}
