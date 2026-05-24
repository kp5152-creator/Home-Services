"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // The app still works normally if a browser blocks service workers.
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}
