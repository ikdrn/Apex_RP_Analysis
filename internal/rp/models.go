package rp

import "time"

// RPRecord is a single row from the player_rp table.
//
// CreatedAt is intentionally a string: the column is stored as JST wall-clock
// tagged as UTC, and the frontend consumes the raw ISO string. Keeping it as a
// string avoids lossy round-tripping and parse failures across timestamp/
// timestamptz formats.
type RPRecord struct {
	ID        int    `json:"id"`
	RP        int    `json:"rp"`
	CreatedAt string `json:"created_at"`
}

// Period is the inclusive window a response covers.
type Period struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// FetchResponse is the envelope returned by GET /api/rp.
type FetchResponse struct {
	Data      []RPRecord `json:"data"`
	Total     int        `json:"total"`     // rows available for the period
	Displayed int        `json:"displayed"` // rows actually returned
	Period    Period     `json:"period"`
	Cached    bool       `json:"cached"`     // served from the in-memory cache
	CachedAt  *time.Time `json:"cached_at"`  // when it was cached (nil if fresh)
	Timestamp time.Time  `json:"timestamp"`  // response generation time (UTC)
}
