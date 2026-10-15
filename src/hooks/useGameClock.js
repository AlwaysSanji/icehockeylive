import { useState, useEffect } from 'react';
import { formatTimeMMSS, calculateRemainingSeconds } from '../utils/timeFormatter';

export function useGameClock(clockState) {
  const [remaining, setRemaining] = useState(() => calculateRemainingSeconds(clockState));

  useEffect(() => {
    // Initial compute
    const currentRemaining = calculateRemainingSeconds(clockState);
    setRemaining(currentRemaining);

    if (!clockState?.running) {
      return;
    }

    // High frequency interval (every 100ms) to ensure smooth second changes
    const interval = setInterval(() => {
      const computed = calculateRemainingSeconds(clockState);
      setRemaining(computed);
    }, 100);

    return () => clearInterval(interval);
  }, [clockState?.running, clockState?.remainingSeconds, clockState?.lastUpdatedAt]);

  return {
    remainingSeconds: remaining,
    formattedTime: formatTimeMMSS(remaining),
    isRunning: Boolean(clockState?.running)
  };
}
