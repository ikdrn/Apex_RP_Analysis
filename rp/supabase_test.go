package rp

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
)

func TestFetchPagedPaginatesAllRows(t *testing.T) {
	const total = 2500
	const limit = 1000

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/player_rp" {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		q := r.URL.Query()
		off, _ := strconv.Atoi(q.Get("offset"))
		lim, _ := strconv.Atoi(q.Get("limit"))

		page := make([]RPRecord, 0, lim)
		for i := off; i < off+lim && i < total; i++ {
			page = append(page, RPRecord{ID: i + 1, RP: 1000 + i, CreatedAt: "2026-01-01T00:00:00Z"})
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(page)
	}))
	defer srv.Close()

	start, _, _ := GetPeriodRange("all")
	got, err := fetchPaged(srv.URL, "test-key", start, "all", limit)
	if err != nil {
		t.Fatalf("fetchPaged error: %v", err)
	}
	if len(got) != total {
		t.Fatalf("fetched %d rows, want %d", len(got), total)
	}
	if got[0].ID != 1 || got[total-1].ID != total {
		t.Errorf("unexpected first/last ids: %d / %d", got[0].ID, got[total-1].ID)
	}
}

func TestFetchPagedWindowedSendsFilter(t *testing.T) {
	var sawCreatedAtFilter, sawRPFilter bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if q.Get("created_at") != "" {
			sawCreatedAtFilter = true
		}
		if q.Get("rp") == "gt.0" {
			sawRPFilter = true
		}
		_ = json.NewEncoder(w).Encode([]RPRecord{})
	}))
	defer srv.Close()

	start, _, _ := GetPeriodRange("30")
	if _, err := fetchPaged(srv.URL, "k", start, "30", 1000); err != nil {
		t.Fatalf("err: %v", err)
	}
	if !sawCreatedAtFilter {
		t.Error("expected created_at filter for a windowed range")
	}
	if !sawRPFilter {
		t.Error("expected rp=gt.0 filter")
	}
}

func TestFetchPagedAllRangeOmitsCreatedAtFilter(t *testing.T) {
	var sawCreatedAtFilter bool
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("created_at") != "" {
			sawCreatedAtFilter = true
		}
		_ = json.NewEncoder(w).Encode([]RPRecord{})
	}))
	defer srv.Close()

	start, _, _ := GetPeriodRange("all")
	if _, err := fetchPaged(srv.URL, "k", start, "all", 1000); err != nil {
		t.Fatalf("err: %v", err)
	}
	if sawCreatedAtFilter {
		t.Error("all range should not send a created_at filter")
	}
}
