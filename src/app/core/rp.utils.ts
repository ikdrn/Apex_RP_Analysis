import { DailyRecord, RpRecord, RpSummary, SortDirection } from './rp.model';

const JST_LOCALE = 'ja-JP';
const JST_TIMEZONE = 'Asia/Tokyo';

export function toJstDateLabel(isoString: string): string {
  return new Date(isoString).toLocaleDateString(JST_LOCALE, {
    month: 'numeric',
    day: 'numeric',
    timeZone: JST_TIMEZONE,
  });
}

export function toJstTimeLabel(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(JST_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: JST_TIMEZONE,
  });
}

export function toJstDateTimeLabel(isoString: string): string {
  return new Date(isoString).toLocaleString(JST_LOCALE, { timeZone: JST_TIMEZONE });
}

export function buildChartLabels(records: RpRecord[]): string[] {
  const dateStrings = records.map((record) => toJstDateLabel(record.created_at));
  const dateCount = new Map<string, number>();

  for (const dateString of dateStrings) {
    dateCount.set(dateString, (dateCount.get(dateString) ?? 0) + 1);
  }

  return records.map((record, index) => {
    const dateString = dateStrings[index];
    return (dateCount.get(dateString) ?? 0) > 1
      ? `${dateString} ${toJstTimeLabel(record.created_at)}`
      : dateString;
  });
}

export function buildSummary(records: RpRecord[]): RpSummary {
  if (records.length === 0) {
    return {
      latestRp: null,
      maxRp: null,
      minRp: null,
      rpChange: null,
      avgRp: null,
      rpPerDay: null,
    };
  }

  const first = records[0];
  const last = records[records.length - 1];
  const sum = records.reduce((current, record) => current + record.rp, 0);
  const max = records.reduce((current, record) => Math.max(current, record.rp), -Infinity);
  const min = records.reduce((current, record) => Math.min(current, record.rp), Infinity);

  const firstMs = new Date(first.created_at).getTime();
  const lastMs = new Date(last.created_at).getTime();
  const days = (lastMs - firstMs) / (1000 * 60 * 60 * 24);
  const rpChange = records.length >= 2 ? last.rp - first.rp : null;
  const rpPerDay = rpChange !== null && days >= 0.01 ? Math.round((rpChange / days) * 10) / 10 : null;

  return {
    latestRp: last.rp,
    maxRp: max,
    minRp: min,
    rpChange,
    avgRp: Math.round(sum / records.length),
    rpPerDay,
  };
}

export function sortRecordsByDate(records: RpRecord[], direction: SortDirection): RpRecord[] {
  return [...records].sort((left, right) => {
    const diff = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    return direction === 'asc' ? diff : -diff;
  });
}

export function filterRecords(records: RpRecord[], query: string): RpRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return records;
  }

  return records.filter((record) => {
    const dateString = toJstDateTimeLabel(record.created_at).toLowerCase();
    return String(record.rp).includes(normalizedQuery) || dateString.includes(normalizedQuery);
  });
}

export function buildDailyRecords(records: RpRecord[], direction: SortDirection): DailyRecord[] {
  const groupedByDay = new Map<string, RpRecord[]>();

  for (const record of records) {
    const dateKey = new Date(record.created_at).toLocaleDateString(JST_LOCALE, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: JST_TIMEZONE,
    });

    if (!groupedByDay.has(dateKey)) {
      groupedByDay.set(dateKey, []);
    }

    groupedByDay.get(dateKey)!.push(record);
  }

  const dailyRecords: DailyRecord[] = [];

  for (const [date, dayRecords] of groupedByDay.entries()) {
    dailyRecords.push({
      date,
      firstRp: dayRecords[0].rp,
      lastRp: dayRecords[dayRecords.length - 1].rp,
      maxRp: dayRecords.reduce((max, record) => Math.max(max, record.rp), -Infinity),
      minRp: dayRecords.reduce((min, record) => Math.min(min, record.rp), Infinity),
      change: dayRecords[dayRecords.length - 1].rp - dayRecords[0].rp,
      count: dayRecords.length,
    });
  }

  return dailyRecords.sort((left, right) => {
    const diff = left.date.localeCompare(right.date);
    return direction === 'asc' ? diff : -diff;
  });
}
