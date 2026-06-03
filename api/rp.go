// Package handler is the Vercel Go serverless entrypoint for the RP API.
//
// Vercel routes every /api/* request to this single function (see vercel.json).
// All business logic lives in the apex-rp-analysis/internal/rp package so that
// Vercel does not mistake helper files in api/ for additional functions.
package handler

import (
	"net/http"
	"sync"

	"apex-rp-analysis/internal/rp"
)

var (
	once sync.Once
	app  http.Handler
)

// Handler builds the Echo application once per warm instance and delegates the
// request to it. On serverless the Echo instance (and its in-memory cache) is
// best-effort per instance, which is acceptable: correctness never depends on a
// cache hit.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() { app = rp.SetupEcho() })
	app.ServeHTTP(w, r)
}
