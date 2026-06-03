import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RangeOption, RpRecord } from './rp.model';

interface CacheEntry {
  data: RpRecord[];
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class RpDataService {
  private readonly http = inject(HttpClient);
  private readonly apiPath = '/api/get-rp';
  private readonly cache = new Map<RangeOption, { observable: Observable<RpRecord[]>, timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  fetchRecords(range: RangeOption): Observable<RpRecord[]> {
    const cached = this.cache.get(range);
    const now = Date.now();

    // Return cached observable if still fresh
    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.observable;
    }

    // Fetch new data and cache the observable
    const request$ = this.http.get<RpRecord[]>(this.apiPath, {
      params: { days: String(range) },
    }).pipe(
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
