import { useState, useEffect } from "react";

type HealthStatus = {
  status: "ok" | "down" | "checking";
  detail?: string;
};

export function useApiHealth(): HealthStatus {
  const [health, setHealth] = useState<HealthStatus>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const maxRetries = 2;

    function check() {
      fetch("/api/ready", { method: "GET", signal: AbortSignal.timeout(5000) })
        .then(async (r) => {
          const text = await r.text();
          if (cancelled) return;
          if (r.status === 200) {
            setHealth({ status: "ok" });
          } else if (r.status === 503) {
            setHealth({ status: "down", detail: "Service is starting up. Please wait a moment." });
          } else if (r.status >= 500) {
            setHealth({ status: "down", detail: `Server error (${r.status}). Please try again.` });
          } else {
            setHealth({ status: "down", detail: `Unexpected response (${r.status}).` });
          }
        })
        .catch(() => {
          if (!cancelled) {
            if (retries < maxRetries) {
              retries++;
              setTimeout(check, 2000);
            } else {
              setHealth({ status: "down", detail: "Unable to connect to server. Check your internet connection." });
            }
          }
        });
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return health;
}
