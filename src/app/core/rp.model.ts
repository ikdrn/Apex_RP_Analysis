export type RpRecord = {
  id: number;
  rp: number;
  created_at: string;
};

export type RangeOption = 7 | 30 | 90 | 'all';

export type SortDirection = 'asc' | 'desc';

export type AppTab = 'analysis' | 'table' | 'daily' | 'weekly' | 'design';

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

// Envelope returned by GET /api/rp (Go/Echo backend).
export interface RpFetchResponse {
  data: RpRecord[];
  total: number;          // rows available for the period
  displayed: number;      // rows actually returned
  period: { start: string; end: string };
  cached: boolean;        // served from the server cache
  cached_at: string | null;
  timestamp: string;      // response generation time (ISO, UTC)
}
