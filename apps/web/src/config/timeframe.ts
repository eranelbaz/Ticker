const UNIT_SECONDS: Record<string, number> = {
  Min: 60,
  Hour: 3600,
  Day: 86400,
};

const TIMEFRAME_RE = /^(\d+)(Min|Hour|Day)$/;

export function timeframeToSeconds(timeframe: string): number {
  const match = TIMEFRAME_RE.exec(timeframe);
  if (!match) {
    throw new Error(`invalid timeframe: ${timeframe}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const unitSeconds = UNIT_SECONDS[unit];
  if (unitSeconds === undefined) {
    throw new Error(`invalid timeframe: ${timeframe}`);
  }

  return value * unitSeconds;
}
