package rp

import (
	"fmt"
	"time"
)

const allRange = "all"

// allStart is the lower bound for the "all" range (service start date).
var allStart = time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

// jst matches the basis player_rp rows are written on: timestamps hold JST
// wall-clock but are tagged +00 by pg_cron. We reinterpret "now" the same way
// so the period cutoff lines up with the stored values.
var jst = time.FixedZone("JST", 9*60*60)

// IsValidDays reports whether raw is an explicitly supported period value.
func IsValidDays(raw string) bool {
	switch raw {
	case "7", "30", "90", allRange:
		return true
	default:
		return false
	}
}

// GetPeriodRange returns the [start, end] window for days, expressed on the
// stored (JST-as-UTC) basis. The end is "now" in JST wall-clock; windowed
// ranges subtract whole days from it.
func GetPeriodRange(days string) (time.Time, time.Time, error) {
	now := time.Now().In(jst)
	end := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), now.Minute(), now.Second(), 0, time.UTC)

	var start time.Time
	switch days {
	case "7":
		start = end.AddDate(0, 0, -7)
	case "30":
		start = end.AddDate(0, 0, -30)
	case "90":
		start = end.AddDate(0, 0, -90)
	case allRange:
		start = allStart
	default:
		return time.Time{}, time.Time{}, fmt.Errorf("invalid days parameter: %s", days)
	}
	return start, end, nil
}
