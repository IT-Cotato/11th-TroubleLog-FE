import { useState, useCallback } from "react";

/**
 * 낙관적 업데이트를 위한 훅
 * API 응답을 기다리지 않고 즉시 UI를 업데이트
 *
 * @example
 * const { optimisticValue, setOptimisticValue, rollback } = useOptimisticUpdate(initialValue);
 *
 * const handleLike = async () => {
 *   setOptimisticValue(true); // 즉시 UI 업데이트
 *   try {
 *     await likePost();
 *   } catch {
 *     rollback(); // 실패 시 롤백
 *   }
 * };
 */
export function useOptimisticUpdate<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [previousValue, setPreviousValue] = useState<T | null>(null);

  const setOptimisticValue = useCallback(
    (newValue: T) => {
      setPreviousValue(value);
      setValue(newValue);
    },
    [value]
  );

  const rollback = useCallback(() => {
    if (previousValue !== null) {
      setValue(previousValue);
      setPreviousValue(null);
    }
  }, [previousValue]);

  const commit = useCallback(() => {
    setPreviousValue(null);
  }, []);

  return {
    optimisticValue: value,
    setOptimisticValue,
    rollback,
    commit,
  };
}
