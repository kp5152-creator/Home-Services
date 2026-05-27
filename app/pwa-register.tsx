"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isLocalDemo = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (isLocalDemo) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      return;
    }

    let refreshing = false;
    const reloadOnControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await registration.update();
        navigator.serviceWorker.addEventListener("controllerchange", reloadOnControllerChange);
      } catch {
        // The app still works normally if a browser blocks service workers.
      }
    };

    registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  return null;
}
