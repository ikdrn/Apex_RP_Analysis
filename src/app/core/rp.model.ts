export type RpRecord = {
  id: number;
  rp: number;
  created_at: string;
};

export type RangeOption = 7 | 30;

export type SortDirection = 'asc' | 'desc';

export type AppTab = 'analysis' | 'table' | 'daily' | 'design';

export type DailyRecord = {
  date: string;
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
