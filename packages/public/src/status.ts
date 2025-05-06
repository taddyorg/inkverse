import { SeriesStatus } from './graphql/types.js';

const allSeriesStatusSet = new Set(Object.values(SeriesStatus));

export function safeSeriesStatus(status?: string): SeriesStatus | null {
  if (!status) return null;
  else if (!allSeriesStatusSet.has(status as SeriesStatus)) return null;
  return status as SeriesStatus;
}

export function getPrettySeriesStatus(seriesStatus: SeriesStatus): string {
  return seriesStatus.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).join(" ")
}