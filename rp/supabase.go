package rp

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// pageSize is the rows-per-request used while paginating Supabase. PostgREST
// caps a single response at 1000 rows by default, so we page until a short page
// arrives — this removes the previous Range: 0-99999 truncation risk.
const pageSize = 1000

// FetchFromSupabase returns every player_rp row (rp > 0) for the window. For the
// "all" range no created_at filter is applied; otherwise rows are filtered to
// created_at >= start.
func FetchFromSupabase(start time.Time, days string) ([]RPRecord, error) {
	baseURL := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if baseURL == "" || serviceKey == "" {
		return nil, fmt.Errorf("missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
	}
	return fetchPaged(baseURL, serviceKey, start, days, pageSize)
}

func buildQuery(start time.Time, days string, limit, offset int) string {
	v := url.Values{}
	v.Set("select", "id,rp,created_at")
	v.Set("rp", "gt.0") // exclude season-transition rp=0 rows (matches the frontend filter)
	v.Set("order", "created_at.asc")
	v.Set("limit", strconv.Itoa(limit))
	v.Set("offset", strconv.Itoa(offset))
	if days != allRange {
		v.Set("created_at", "gte."+start.Format(time.RFC3339))
	}
	return v.Encode()
}

func fetchPaged(baseURL, serviceKey string, start time.Time, days string, limit int) ([]RPRecord, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	all := make([]RPRecord, 0)
	offset := 0

	for {
		endpoint := fmt.Sprintf("%s/rest/v1/player_rp?%s", baseURL, buildQuery(start, days, limit, offset))
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("apikey", serviceKey)
		req.Header.Set("Authorization", "Bearer "+serviceKey)
		req.Header.Set("Accept", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("supabase request failed: %w", err)
		}
		body, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if readErr != nil {
			return nil, fmt.Errorf("reading supabase response: %w", readErr)
		}
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("supabase returned %d: %s", resp.StatusCode, string(body))
		}

		var page []RPRecord
		if err := json.Unmarshal(body, &page); err != nil {
			return nil, fmt.Errorf("parsing supabase response: %w", err)
		}

		all = append(all, page...)
		if len(page) < limit {
			break
		}
		offset += limit
	}

	return all, nil
}
