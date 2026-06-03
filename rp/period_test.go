package rp

import (
	"testing"
	"time"
)

func TestIsValidDays(t *testing.T) {
	cases := map[string]bool{
		"7": true, "30": true, "90": true, "all": true,
		"99": false, "": false, "abc": false, "0": false,
	}
	for in, want := range cases {
		if got := IsValidDays(in); got != want {
			t.Errorf("IsValidDays(%q) = %v, want %v", in, got, want)
		}
	}
}

func TestGetPeriodRangeValid(t *testing.T) {
	for _, days := range []string{"7", "30", "90", "all"} {
		start, end, err := GetPeriodRange(days)
		if err != nil {
			t.Fatalf("GetPeriodRange(%q) unexpected err: %v", days, err)
		}
		if !start.Before(end) {
			t.Errorf("GetPeriodRange(%q): start %v not before end %v", days, start, end)
		}
	}
}

func TestGetPeriodRangeInvalid(t *testing.T) {
	if _, _, err := GetPeriodRange("99"); err == nil {
		t.Error("GetPeriodRange(99) expected error, got nil")
	}
}

func TestGetPeriodRangeWindows(t *testing.T) {
	start7, end, _ := GetPeriodRange("7")
	start30, _, _ := GetPeriodRange("30")

	if d := end.Sub(start7); d < 6*24*time.Hour || d > 8*24*time.Hour {
		t.Errorf("7-day window = %v, want ~168h", d)
	}
	if !start30.Before(start7) {
		t.Error("30-day start should precede 7-day start")
	}

	allS, _, _ := GetPeriodRange("all")
	if allS.Year() != 2024 || allS.Month() != time.January || allS.Day() != 1 {
		t.Errorf("all start = %v, want 2024-01-01", allS)
	}
}

func TestGetPeriodRangeUsesJSTBasis(t *testing.T) {
	// end should equal the current JST wall-clock reinterpreted as UTC, i.e.
	// roughly 9h ahead of the real UTC instant.
	_, end, _ := GetPeriodRange("30")
	skew := end.Sub(time.Now().UTC())
	if skew < 8*time.Hour || skew > 10*time.Hour {
		t.Errorf("end skew from real UTC = %v, want ~9h (JST basis)", skew)
	}
}
