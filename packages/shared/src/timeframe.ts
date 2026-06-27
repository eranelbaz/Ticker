const UNIT_SECONDS: Record<string, number> = {
  Min: 60,
  Hour: 3600,
  Day: 86400,
  Sec: 1,
};

const TIMEFRAME_RE = /^(\d+)(Min|Hour|Day|Sec)$/;

export function timeframeToSeconds(timeframe: string): number {
  const match = TIMEFRAME_RE.exec(timeframe);
  if (!match) {
    throw new Error(`invalid timeframe: ${timeframe}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * UNIT_SECONDS[unit];
}
