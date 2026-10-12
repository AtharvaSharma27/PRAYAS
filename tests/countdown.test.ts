import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../lib/useCountdown';

describe('useCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with given seconds and running state', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 60, autoStart: true })
    );

    expect(result.current.secondsRemaining).toBe(60);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isFinished).toBe(false);
    expect(result.current.progress).toBe(1);
  });

  it('ticks down seconds every interval', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 30, autoStart: true, onTick })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsRemaining).toBe(27);
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(result.current.progress).toBeCloseTo(27 / 30, 2);
  });

  it('triggers onFinish and stops when timer hits 0', () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 5, autoStart: true, onFinish })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.secondsRemaining).toBe(0);
    expect(result.current.isFinished).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('supports pause and resume', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 20, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsRemaining).toBe(18);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Should still be 18 because paused
    expect(result.current.secondsRemaining).toBe(18);

    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsRemaining).toBe(16);
  });

  it('resets timer to new value', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 40, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.secondsRemaining).toBe(30);

    act(() => {
      result.current.reset(50);
    });
    expect(result.current.secondsRemaining).toBe(50);
    expect(result.current.isRunning).toBe(false);
  });
});
