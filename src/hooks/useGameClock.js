import { useState, useEffect, useRef } from 'react';
import { formatTimeMMSS, calculateRemainingSeconds } from '../utils/timeFormatter';
import { arenaAudio } from '../components/GoalHorn';

export function useGameClock(clockState) {
  const [remaining, setRemaining] = useState(() => calculateRemainingSeconds(clockState));
  const buzzerTriggeredRef = useRef(false);

  useEffect(() => {
    // Initial compute
    const currentRemaining = calculateRemainingSeconds(clockState);
    setRemaining(currentRemaining);

    if (!clockState?.running) {
      buzzerTriggeredRef.current = false;
      return;
    }

    // High frequency interval (every 100ms) to ensure smooth second changes
    const interval = setInterval(() => {
      const computed = calculateRemainingSeconds(clockState);
      setRemaining(computed);

      if (computed <= 0 && !buzzerTriggeredRef.current) {
        buzzerTriggeredRef.current = true;
        arenaAudio.playPeriodBuzzer();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [clockState?.running, clockState?.remainingSeconds, clockState?.lastUpdatedAt]);

  return {
    remainingSeconds: remaining,
    formattedTime: formatTimeMMSS(remaining),
    isRunning: Boolean(clockState?.running)
  };
}
