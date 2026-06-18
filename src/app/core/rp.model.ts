export type RpRecord = {
  id: number;
  rp: number;
  created_at: string;
};

export type RangeOption = 7 | 30 | 'all';

export type SortDirection = 'asc' | 'desc';

export type AppTab = 'analysis' | 'table' | 'daily' | 'weekly';

export type DailyRecord = {
  date: string;
  firstRp: number;
  lastRp: number;
  maxRp: number;
  minRp: number;
  change: number;
  count: number;
};

export type WeeklyRecord = {
  weekStart: string;
  weekEnd: string;
  firstRp: number;
  lastRp: number;
  maxRp: number;
  minRp: number;
  change: number;
  count: number;
};

// A rank tier threshold shown in the summary + rank guide.
export type RankThreshold = {
  minRp: number;
  rank: string;
};

// Normalised row shared by the daily and weekly aggregate tables so a
// single table component renders both (DRY). `label` is the primary
// cell (a date or a week-start); `subLabel` is the optional week-end.
export type AggregateRow = {
  label: string;
  subLabel?: string;
  firstRp: number;
  lastRp: number;
  maxRp: number;
  minRp: number;
  change: number;
  count: number;
};

export type RpSummary = {
  latestRp: number | null;
  maxRp: number | null;
  minRp: number | null;
  rpChange: number | null;
  avgRp: number | null;
  rpPerDay: number | null;
};
