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
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) {
            setHealth(data.status === "ready" ? { status: "ok" } : { status: "down", detail: "Database is not reachable. Ensure Docker MySQL container is running." });
          }
        })
        .catch(() => {
          if (!cancelled) {
            if (retries < maxRetries) {
              retries++;
              setTimeout(check, 2000);
            } else {
              setHealth({ status: "down", detail: "Cannot reach the API server. Make sure 'npm run dev' is running and Docker MySQL is started." });
            }
          }
        });
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return health;
}
