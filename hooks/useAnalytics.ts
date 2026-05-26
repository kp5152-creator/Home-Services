"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@/utils/types";

type AnalyticsPayload = {
  name: AnalyticsEventName;
  role?: string;
  screen?: string;
  workflow?: string;
  target?: string;
  feature?: string;
  demoMode?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
};

type WorkflowAnalyticsContext = {
  screen: string;
  role: string;
  demoMode: boolean;
  propertyId?: string;
};

const sessionKey = "estateiq_analytics_session";

export function trackAnalyticsEvent(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const event = {
    ...payload,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString()
  };
  const body = JSON.stringify(event);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      if (sent) return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    });
  } catch {
    // Analytics is intentionally best effort and should never interrupt field work.
  }
}

export function useWorkflowAnalytics({ screen, role, demoMode, propertyId }: WorkflowAnalyticsContext) {
  const lastActivityRef = useRef(Date.now());
  const lastStuckSignalRef = useRef("");

  useEffect(() => {
    trackAnalyticsEvent({
      name: "screen_view",
      role,
      screen,
      demoMode,
      metadata: { hasProperty: Boolean(propertyId), deviceType: getDeviceType() }
    });
  }, [demoMode, propertyId, role, screen]);

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    function handleClick(event: MouseEvent) {
      markActivity();

      const target = event.target instanceof Element ? event.target : null;
      const actionable = target?.closest("button,a,[data-analytics]");
      if (!actionable) return;

      trackAnalyticsEvent({
        name: "click",
        role,
        screen,
        target: describeElement(actionable),
        demoMode,
        metadata: { hasProperty: Boolean(propertyId), deviceType: getDeviceType() }
      });
    }

    function handleInput() {
      markActivity();
    }

    const interval = window.setInterval(() => {
      const stuckKey = `${role}:${screen}:${propertyId ?? "no-property"}`;
      const inactiveMs = Date.now() - lastActivityRef.current;

      if (inactiveMs > 75_000 && lastStuckSignalRef.current !== stuckKey) {
        lastStuckSignalRef.current = stuckKey;
        trackAnalyticsEvent({
          name: "stuck_signal",
          role,
          screen,
          workflow: screen.toLowerCase(),
          target: "inactive_on_screen",
          demoMode,
          metadata: {
            inactiveSeconds: Math.round(inactiveMs / 1000),
            hasProperty: Boolean(propertyId),
            deviceType: getDeviceType()
          }
        });
      }
    }, 15_000);

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("keydown", handleInput, true);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("keydown", handleInput, true);
    };
  }, [demoMode, propertyId, role, screen]);
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(sessionKey);
    if (existing) return existing;

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(sessionKey, sessionId);
    return sessionId;
  } catch {
    return `session-${Date.now()}`;
  }
}

function describeElement(element: Element) {
  const explicit = element.getAttribute("data-analytics");
  const aria = element.getAttribute("aria-label");
  const title = element.getAttribute("title");
  const text = element.textContent?.replace(/\s+/g, " ").trim();

  return (explicit || aria || title || text || element.tagName.toLowerCase()).slice(0, 120);
}

function getDeviceType() {
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}
