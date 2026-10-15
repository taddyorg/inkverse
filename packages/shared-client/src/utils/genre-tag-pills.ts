import { getPrettyGenre } from '@inkverse/public/genres';
import type { ComicSeries, Genre } from '../graphql/operations.js';

export type GenreTagPill = {
  kind: 'genre' | 'tag';
  value: string;
  label: string;
};

// Genres and tags share one group of lowercase pills
export function getGenreAndTagPills(comicseries: Pick<ComicSeries, 'genre0' | 'genre1' | 'genre2' | 'tags'>): GenreTagPill[] {
  const genres = [comicseries.genre0, comicseries.genre1, comicseries.genre2].filter(Boolean) as Genre[];
  const tags = (comicseries.tags?.filter(Boolean) ?? []) as string[];
  const pills: GenreTagPill[] = [
    ...genres.map(genre => ({ kind: 'genre' as const, value: genre, label: getPrettyGenre(genre).toLowerCase() })),
    ...tags.map(tag => ({ kind: 'tag' as const, value: tag, label: tag.trim().toLowerCase() })),
  ];
  // Drop tags that repeat a genre (or each other), ignoring spacing and punctuation, e.g. "scifi" vs "sci-fi".
  // Genres come first, so the genre pill wins.
  const keyOf = (pill: GenreTagPill) => pill.label.replace(/[^a-z0-9]/g, '');
  const seen = new Set<string>();
  return pills.filter(pill => {
    const key = keyOf(pill);
    return !!key && !seen.has(key) && !!seen.add(key);
  });
}
