import { useCallback, useEffect, useState } from "react";
import { listHabits } from "../api/habits.js";

export default function useHabitList() {
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    listHabits({ signal: controller.signal })
      .then((loadedHabits) => {
        setHabits(loadedHabits);
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

  return { habits, setHabits, isLoading, error, reload };
}
