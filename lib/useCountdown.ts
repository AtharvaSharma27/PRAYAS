import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountdownOptions {
  initialSeconds: number;
  autoStart?: boolean;
  onFinish?: () => void;
  onTick?: (remaining: number) => void;
}

export interface UseCountdownReturn {
  secondsRemaining: number;
  isRunning: boolean;
  isFinished: boolean;
  progress: number; // 0 to 1 (0 = complete, 1 = full)
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
}

export function useCountdown({
  initialSeconds,
  autoStart = true,
  onFinish,
  onTick,
}: UseCountdownOptions): UseCountdownReturn {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  const onFinishRef = useRef(onFinish);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onTickRef.current = onTick;
  }, [onFinish, onTick]);

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onFinishRef.current?.();
          return 0;
        }
        const next = prev - 1;
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const start = useCallback(() => {
    if (secondsRemaining > 0) {
      setIsRunning(true);
    }
  }, [secondsRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      const target = newSeconds !== undefined ? newSeconds : totalSeconds;
      setTotalSeconds(target);
      setSecondsRemaining(target);
      setIsRunning(false);
    },
    [totalSeconds]
  );

  const progress =
    totalSeconds > 0 ? Math.max(0, Math.min(1, secondsRemaining / totalSeconds)) : 0;

  return {
    secondsRemaining,
    isRunning,
    isFinished: secondsRemaining <= 0,
    progress,
    start,
    pause,
    reset,
  };
}
