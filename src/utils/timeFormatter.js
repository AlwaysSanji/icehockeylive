// Time formatting and hockey clock utilities

export function formatTimeMMSS(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPeriodName(period) {
  const p = String(period).toUpperCase();
  if (p === '1') return '1st Period';
  if (p === '2') return '2nd Period';
  if (p === '3') return '3rd Period';
  if (p === 'OT') return 'Overtime (OT)';
  if (p === 'SO') return 'Shootout (SO)';
  if (p === 'FT') return 'Full Time';
  return `Period ${p}`;
}

export function calculateRemainingSeconds(clockState) {
  if (!clockState) return 1200;
  if (!clockState.running) return Math.max(0, clockState.remainingSeconds);
  
  const elapsed = (Date.now() - (clockState.lastUpdatedAt || Date.now())) / 1000;
  return Math.max(0, Math.round(clockState.remainingSeconds - elapsed));
}
