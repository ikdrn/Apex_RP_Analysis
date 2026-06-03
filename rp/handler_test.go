package rp

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleFetchRecordsEnvelope(t *testing.T) {
	ClearCache()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode([]RPRecord{
			{ID: 1, RP: 12000, CreatedAt: "2026-01-01T00:00:00Z"},
			{ID: 2, RP: 12500, CreatedAt: "2026-01-02T00:00:00Z"},
		})
	}))
	defer srv.Close()
	t.Setenv("SUPABASE_URL", srv.URL)
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "test")

	e := SetupEcho()
	req := httptest.NewRequest(http.MethodGet, "/api/rp?days=30&skip_cache=true", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var resp FetchResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if resp.Total != 2 || resp.Displayed != 2 || len(resp.Data) != 2 {
		t.Errorf("counts: total=%d displayed=%d data=%d, want 2/2/2", resp.Total, resp.Displayed, len(resp.Data))
	}
	if resp.Cached {
		t.Error("skip_cache=true should not be served from cache")
	}
	if resp.Timestamp.IsZero() {
		t.Error("expected a response timestamp")
	}
}

func TestHandleFetchRecordsInvalidDays(t *testing.T) {
	e := SetupEcho()
	req := httptest.NewRequest(http.MethodGet, "/api/rp?days=99", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestHandleFetchRecordsCacheHit(t *testing.T) {
	ClearCache()
	var calls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		_ = json.NewEncoder(w).Encode([]RPRecord{{ID: 1, RP: 100, CreatedAt: "2026-01-01T00:00:00Z"}})
	}))
	defer srv.Close()
	t.Setenv("SUPABASE_URL", srv.URL)
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "test")

	e := SetupEcho()
	do := func(path string) FetchResponse {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		var resp FetchResponse
		_ = json.Unmarshal(rec.Body.Bytes(), &resp)
		return resp
	}

	first := do("/api/rp?days=7")
	if first.Cached {
		t.Error("first call should be fresh")
	}
	second := do("/api/rp?days=7")
	if !second.Cached || second.CachedAt == nil {
		t.Error("second call should be served from cache with cached_at set")
	}
	if calls != 1 {
		t.Errorf("supabase hit %d times, want 1 (cache should absorb the second)", calls)
	}
}
