import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RangeOption, RpFetchResponse } from './rp.model';

@Injectable({ providedIn: 'root' })
export class RpDataService {
  private readonly http = inject(HttpClient);
  private readonly apiPath = '/api/rp';
  private readonly cache = new Map<RangeOption, { observable: Observable<RpFetchResponse>, timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  fetchRecords(range: RangeOption, skipCache = false): Observable<RpFetchResponse> {
    const cached = this.cache.get(range);
    const now = Date.now();

    // Return the cached observable if still fresh — unless this is an explicit refresh.
    if (!skipCache && cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.observable;
    }

    const params: Record<string, string> = { days: String(range) };
    if (skipCache) {
      // Tell the backend to bypass its own cache and re-read from Supabase.
      params['skip_cache'] = 'true';
    }

    const request$ = this.http.get<RpFetchResponse>(this.apiPath, { params }).pipe(
      tap(() => {
        // Update cache timestamp on successful response
        const entry = this.cache.get(range);
        if (entry) {
          entry.timestamp = Date.now();
        }
      }),
      shareReplay(1) // Share the same observable among all subscribers
    );

    this.cache.set(range, { observable: request$, timestamp: now });
    return request$;
  }

  getLastUpdatedTime(range: RangeOption): Date | null {
    const cached = this.cache.get(range);
    return cached ? new Date(cached.timestamp) : null;
  }

  clearCache(range?: RangeOption): void {
    if (range) {
      this.cache.delete(range);
    } else {
      this.cache.clear();
    }
  }
}
