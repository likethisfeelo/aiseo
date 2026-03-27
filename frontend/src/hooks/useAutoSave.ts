import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSaveOptions<T> {
  data: T;
  saveFn: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ data, saveFn, delay = 2000, enabled = true }: AutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const lastJsonRef = useRef('');
  const mountedRef = useRef(false);

  dataRef.current = data;

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await saveFn(dataRef.current);
      setLastSaved(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }, [saveFn]);

  useEffect(() => {
    if (!enabled) return;

    const json = JSON.stringify(data);

    // Skip initial mount and initial data load
    if (!mountedRef.current) {
      mountedRef.current = true;
      lastJsonRef.current = json;
      return;
    }

    // Skip if data hasn't actually changed
    if (json === lastJsonRef.current) return;
    lastJsonRef.current = json;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled, save]);

  return { saving, lastSaved, error, save };
}
