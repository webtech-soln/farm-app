"use client";

import { useEffect } from "react";

/**
 * The last resort: this replaces the root layout, so it cannot rely on the
 * app's own components — or even on the stylesheet having loaded, since a
 * failure this high up may be the reason it did not. Everything here is inline
 * and self-contained on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root] render failed", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#fafafa",
          color: "#18181b",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 .6rem",
              letterSpacing: "-0.3px",
            }}
          >
            Jayda Farms is temporarily unavailable
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.55, color: "#71717a" }}>
            Something failed while starting the app. Your records are safe — this
            is a problem with the page, not the data behind it.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              cursor: "pointer",
              borderRadius: "8px",
              padding: ".6rem 1.1rem",
              fontSize: ".95rem",
              fontWeight: 600,
              color: "#ffffff",
              background: "#7c3aed",
            }}
          >
            Reload
          </button>

          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: ".78rem",
                color: "#a1a1aa",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
