import { useCallback, useEffect, useState } from "react";
import { getWeeklyInsights } from "../api/insights.js";

export default function useWeeklyInsights() {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    getWeeklyInsights({ signal: controller.signal })
      .then((loadedInsights) => {
        setInsights(loadedInsights);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (loadError.name === "AbortError") {
          return;
        }
        console.error(loadError);
        setError(loadError);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { insights, isLoading, error, reload };
}
