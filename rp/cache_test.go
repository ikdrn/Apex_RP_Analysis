package rp

import (
	"testing"
	"time"
)

func TestCacheSetGetClear(t *testing.T) {
	ClearCache()
	if _, _, ok := GetCachedRecords("30"); ok {
		t.Fatal("expected empty cache")
	}

	data := []RPRecord{{ID: 1, RP: 100, CreatedAt: "2026-01-01T00:00:00Z"}}
	SetCachedRecords("30", data)

	got, cachedAt, ok := GetCachedRecords("30")
	if !ok || len(got) != 1 || got[0].RP != 100 {
		t.Fatalf("expected cached data, got ok=%v data=%v", ok, got)
	}
	if cachedAt.IsZero() {
		t.Error("expected non-zero cachedAt")
	}

	ClearCache()
	if _, _, ok := GetCachedRecords("30"); ok {
		t.Fatal("expected cache cleared")
	}
}

func TestCacheExpiry(t *testing.T) {
	ClearCache()
	recordsCache.Store("7", cacheEntry{
		data:     []RPRecord{{ID: 1}},
		cachedAt: time.Now().Add(-10 * time.Minute),
		expires:  time.Now().Add(-5 * time.Minute),
	})
	if _, _, ok := GetCachedRecords("7"); ok {
		t.Fatal("expected expired entry to be a miss")
	}
}
