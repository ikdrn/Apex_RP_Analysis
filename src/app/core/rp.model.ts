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

export type RpSummary = {
  latestRp: number | null;
  maxRp: number | null;
  minRp: number | null;
  rpChange: number | null;
  avgRp: number | null;
  rpPerDay: number | null;
};
