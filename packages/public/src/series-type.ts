import { ComicSeriesType } from './graphql/types.js';

const allSeriesTypeSet = new Set(Object.values(ComicSeriesType));

export function safeSeriesType(type?: string): ComicSeriesType | null {
  if (!type) return null;
  else if (!allSeriesTypeSet.has(type as ComicSeriesType)) return null;
  return type as ComicSeriesType;
}

export function getPrettySeriesType(seriesType: ComicSeriesType): string {
  return seriesType.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).join(" ")
}