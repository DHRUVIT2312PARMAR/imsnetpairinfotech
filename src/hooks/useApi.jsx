import { useState, useEffect, useCallback } from "react";

/**
 * useApi — generic data fetching hook with optional polling
 * @param {Function} fetchFn  — async function that returns data
 * @param {Array}    deps     — re-fetch when these change
 * @param {number|null} interval — polling interval in ms (null = no polling)
 */
const useApi = (fetchFn, deps = [], interval = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
    if (interval) {
      const id = setInterval(fetchData, interval);
      return () => clearInterval(id); // cleanup
    }
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
};

export default useApi;
