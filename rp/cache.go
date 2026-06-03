package rp

import (
	"sync"
	"time"
)

// CacheTTL is how long a period's records stay fresh. On serverless this cache
// is best-effort per warm instance, never shared between instances.
const CacheTTL = 5 * time.Minute

type cacheEntry struct {
	data     []RPRecord
	cachedAt time.Time
	expires  time.Time
}

var recordsCache sync.Map // days(string) -> cacheEntry

// GetCachedRecords returns cached rows and when they were cached, if still fresh.
func GetCachedRecords(days string) ([]RPRecord, time.Time, bool) {
	v, ok := recordsCache.Load(days)
	if !ok {
		return nil, time.Time{}, false
	}
	entry := v.(cacheEntry)
	if time.Now().After(entry.expires) {
		recordsCache.Delete(days)
		return nil, time.Time{}, false
	}
	return entry.data, entry.cachedAt, true
}

// SetCachedRecords stores rows for a period with a TTL.
func SetCachedRecords(days string, data []RPRecord) {
	now := time.Now()
	recordsCache.Store(days, cacheEntry{
		data:     data,
		cachedAt: now,
		expires:  now.Add(CacheTTL),
	})
}

// ClearCache removes all cached periods.
func ClearCache() {
	recordsCache.Range(func(k, _ any) bool {
		recordsCache.Delete(k)
		return true
	})
}
