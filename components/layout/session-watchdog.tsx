"use client";

import { useEffect, useRef } from "react";

/** How often the idle check runs. */
const TICK_MS = 15_000;

/**
 * Ends an idle session in the browser as well as on the server.
 *
 * The server already refuses a session that has sat unused past its idle
 * deadline, but a tab left open would keep showing a screen it can no longer
 * act on until something is clicked. This watches for real activity, keeps an
 * active session alive through the heartbeat, and sends an idle tab to the
 * sign-in page the moment the window lapses.
 */
export function SessionWatchdog({
  idleMs,
  /** Interactions within this window of the last one are not re-sent. */
  heartbeatMs = 5 * 60 * 1000,
}: {
  idleMs: number;
  heartbeatMs?: number;
}) {
  // Stamped on mount rather than during render, which has to stay pure.
  const lastActivity = useRef(0);
  const lastHeartbeat = useRef(0);
  const expiring = useRef(false);

  useEffect(() => {
    lastActivity.current = Date.now();
    lastHeartbeat.current = Date.now();

    const expire = () => {
      if (expiring.current) return;
      expiring.current = true;
      // A full load, not a client navigation: the route clears the cookie and
      // the server re-evaluates everything this tab had cached.
      window.location.replace("/api/session/end");
    };

    const heartbeat = async () => {
      lastHeartbeat.current = Date.now();
      try {
        const response = await fetch("/api/session/heartbeat", {
          method: "POST",
          cache: "no-store",
        });
        if (response.status === 401) expire();
      } catch {
        // Offline or a dropped request: the next tick tries again.
      }
    };

    const onActivity = () => {
      const now = Date.now();
      // Activity after the window has already lapsed cannot revive the
      // session — the server has dropped it.
      if (now - lastActivity.current >= idleMs) {
        expire();
        return;
      }
      lastActivity.current = now;
      if (now - lastHeartbeat.current >= heartbeatMs) void heartbeat();
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Covers a laptop that slept: check the clock before trusting the tab.
      if (Date.now() - lastActivity.current >= idleMs) expire();
      else void heartbeat();
    };

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "wheel",
      "focus",
    ];
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisible);

    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= idleMs) expire();
    }, TICK_MS);

    return () => {
      for (const event of events) window.removeEventListener(event, onActivity);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [idleMs, heartbeatMs]);

  return null;
}
