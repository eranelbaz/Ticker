export const DEFAULT_TIMEFRAME = '1Min';

const VALID_SECONDS: Record<string, number> = {
  Min: 60,
  Hour: 3600,
  Day: 86400,
};

const TIMEFRAME_RE = /^(\d+)(Min|Hour|Day|Sec)$/;

export function timeframeToSeconds(timeframe: string): number {
  const match = TIMEFRAME_RE.exec(timeframe);
  if (!match) {
    throw new Error(`invalid timeframe: ${timeframe}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === 'Sec') {
    throw new Error('sub-minute timeframes are not supported');
  }

  const unitSeconds = VALID_SECONDS[unit];
  if (unitSeconds === undefined) {
    throw new Error(`invalid timeframe: ${timeframe}`);
  }

  return value * unitSeconds;
}
