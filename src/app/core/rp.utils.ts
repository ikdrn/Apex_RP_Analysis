import { DailyRecord, RpRecord, RpSummary, SortDirection, WeeklyRecord } from './rp.model';

const JST_LOCALE = 'ja-JP';
// DB stores JST time without timezone offset (stored as +00 due to pg_cron INSERT behavior).
// Displaying as UTC shows the correct JST value without double-converting (+9h).
const JST_TIMEZONE = 'UTC';

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

export function buildRecordDiffMap(records: RpRecord[]): Map<number, number | null> {
  const sorted = sortRecordsByDate(records, 'asc');
  const diffs = new Map<number, number | null>();

  sorted.forEach((record, index) => {
    if (index === 0) {
      diffs.set(record.id, null);
      return;
    }

    const previous = sorted[index - 1];
    diffs.set(record.id, record.rp - previous.rp);
  });

  return diffs;
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

// JST date components from a stored timestamp (which is JST-as-UTC).
function getJstParts(isoString: string): { year: number; month: number; day: number } {
  const date = new Date(isoString);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function formatYmd(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}/${mm}/${dd}`;
}

// Returns the Sunday (week start) for the given JST date as a yyyy/mm/dd key.
function getWeekStartKey(isoString: string): { key: string; startDate: Date } {
  const { year, month, day } = getJstParts(isoString);
  const utcMidnight = new Date(Date.UTC(year, month, day));
  const dayOfWeek = utcMidnight.getUTCDay();
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - dayOfWeek);
  return {
    key: formatYmd(utcMidnight.getUTCFullYear(), utcMidnight.getUTCMonth(), utcMidnight.getUTCDate()),
    startDate: utcMidnight,
  };
}

export function buildWeeklyRecords(records: RpRecord[], direction: SortDirection): WeeklyRecord[] {
  const groupedByWeek = new Map<string, { records: RpRecord[]; startDate: Date }>();

  for (const record of records) {
    const { key, startDate } = getWeekStartKey(record.created_at);
    if (!groupedByWeek.has(key)) {
      groupedByWeek.set(key, { records: [], startDate });
    }
    groupedByWeek.get(key)!.records.push(record);
  }

  const weeklyRecords: WeeklyRecord[] = [];

  for (const [key, { records: weekRecords, startDate }] of groupedByWeek.entries()) {
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    const weekEnd = formatYmd(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    weeklyRecords.push({
      weekStart: key,
      weekEnd,
      firstRp: weekRecords[0].rp,
      lastRp: weekRecords[weekRecords.length - 1].rp,
      maxRp: weekRecords.reduce((max, record) => Math.max(max, record.rp), -Infinity),
      minRp: weekRecords.reduce((min, record) => Math.min(min, record.rp), Infinity),
      change: weekRecords[weekRecords.length - 1].rp - weekRecords[0].rp,
      count: weekRecords.length,
    });
  }

  return weeklyRecords.sort((left, right) => {
    const diff = left.weekStart.localeCompare(right.weekStart);
    return direction === 'asc' ? diff : -diff;
  });
}
