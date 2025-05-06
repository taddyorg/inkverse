import { ComicSeriesLayoutType } from './graphql/types.js';

const allLayoutTypeSet = new Set(Object.values(ComicSeriesLayoutType));

export function safeLayoutType(type?: string): ComicSeriesLayoutType | null {
  if (!type) return null;
  else if (!allLayoutTypeSet.has(type as ComicSeriesLayoutType)) return null;
  return type as ComicSeriesLayoutType;
}

export function getPrettyLayoutType(layoutType: ComicSeriesLayoutType): string {
  return layoutType.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).join(" ")
}