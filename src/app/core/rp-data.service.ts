import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RangeOption, RpRecord } from './rp.model';

@Injectable({ providedIn: 'root' })
export class RpDataService {
  private readonly http = inject(HttpClient);
  private readonly apiPath = '/api/get-rp';

  fetchRecords(days: RangeOption): Observable<RpRecord[]> {
    return this.http.get<RpRecord[]>(this.apiPath, {
      params: { days: String(days) },
    });
  }
}
