export type DatedCareRecord = { activityDate: Date | string };

export function filterCareRecordsByDateRange<T extends DatedCareRecord>(records: T[], fromDate?: string, toDate?: string) {
  return records.filter(record => {
    const key = new Date(record.activityDate).toISOString().slice(0, 10);
    return (!fromDate || key >= fromDate) && (!toDate || key <= toDate);
  });
}
