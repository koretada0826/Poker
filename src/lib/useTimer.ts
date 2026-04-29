import { useEffect, useState } from 'react';

const KEY = 'poker-3h-timer-v1';
const TOTAL_SECONDS = 3 * 60 * 60;

interface TimerData {
  startedAt: number | null; // epoch ms
  pausedAt: number | null;  // 経過秒で固定された時の値（一時停止用）
}

function load(): TimerData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { startedAt: null, pausedAt: null };
    return JSON.parse(raw);
  } catch {
    return { startedAt: null, pausedAt: null };
  }
}

function save(d: TimerData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch { /* ignore */ }
}

export function useTimer() {
  const [data, setData] = useState<TimerData>(() => load());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    save(data);
  }, [data]);

  useEffect(() => {
    if (data.startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data.startedAt]);

  const elapsed =
    data.startedAt === null
      ? data.pausedAt ?? 0
      : Math.floor((now - data.startedAt) / 1000);

  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  const start = () => {
    const carry = data.pausedAt ?? 0;
    setData({ startedAt: Date.now() - carry * 1000, pausedAt: null });
  };
  const pause = () => {
    if (data.startedAt !== null) {
      setData({ startedAt: null, pausedAt: elapsed });
    }
  };
  const reset = () => {
    setData({ startedAt: null, pausedAt: null });
  };

  const running = data.startedAt !== null;
  const fmt = formatTime(remaining);

  return { remaining, elapsed, running, start, pause, reset, fmt };
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
