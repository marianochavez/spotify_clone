import { useEffect, useState } from "react";

/**
 * Debounces a value by delaying its update until a certain amount of time
 * has passed without any new updates being made. Returns the debounced value.
 *
 * @param {T} value - The value to be debounced
 * @param {number} [delay=500] - The time in milliseconds to wait before updating the value
 * @return {T} The debounced value
 */
function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
