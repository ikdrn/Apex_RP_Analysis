package rp

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

// SetupEcho builds the Echo application: middleware + the single /api/rp route.
func SetupEcho() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.Use(middleware.Recover())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format:           "${time_custom} | ${method} ${path} | ${status} | ${latency_human}\n",
		CustomTimeFormat: "2006-01-02 15:04:05.000",
	}))
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: allowedOrigins(),
		AllowMethods: []string{http.MethodGet, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
	}))
	// ~60 requests/minute per IP (best-effort, per instance), mirroring the
	// previous Node backend.
	e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(middleware.RateLimiterMemoryStoreConfig{
			Rate:      rate.Limit(1),
			Burst:     60,
			ExpiresIn: 3 * time.Minute,
		}),
		IdentifierExtractor: func(c echo.Context) (string, error) { return c.RealIP(), nil },
	}))

	// Optional HTTP Basic Auth — only enforced when both env vars are present.
	if user, pass := os.Getenv("BASIC_AUTH_USER"), os.Getenv("BASIC_AUTH_PASS"); user != "" && pass != "" {
		e.Use(middleware.BasicAuth(func(u, p string, _ echo.Context) (bool, error) {
			return u == user && p == pass, nil
		}))
	}

	e.GET("/api/rp", handleFetchRecords)
	return e
}

func allowedOrigins() []string {
	o := strings.TrimSpace(os.Getenv("ALLOWED_ORIGIN"))
	if o == "" || o == "*" {
		return []string{"*"}
	}
	return []string{o, "http://localhost:4200"}
}

// handleFetchRecords serves GET /api/rp.
func handleFetchRecords(c echo.Context) error {
	days := c.QueryParam("days")
	if days == "" {
		days = "30"
	}
	if !IsValidDays(days) {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error":   "Invalid days parameter",
			"message": "days must be 7, 30, 90, or 'all'",
		})
	}
	skipCache := c.QueryParam("skip_cache") == "true"

	start, end, err := GetPeriodRange(days)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	var (
		records  []RPRecord
		cached   bool
		cachedAt time.Time
	)
	if !skipCache {
		records, cachedAt, cached = GetCachedRecords(days)
	}
	if !cached {
		records, err = FetchFromSupabase(start, days)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"error":   "Failed to fetch data",
				"message": err.Error(),
			})
		}
		SetCachedRecords(days, records)
	}
	if records == nil {
		records = []RPRecord{}
	}

	resp := FetchResponse{
		Data:      records,
		Total:     len(records),
		Displayed: len(records),
		Period:    Period{Start: start, End: end},
		Cached:    cached,
		Timestamp: time.Now().UTC(),
	}
	if cached {
		ca := cachedAt.UTC()
		resp.CachedAt = &ca
	}
	return c.JSON(http.StatusOK, resp)
}
