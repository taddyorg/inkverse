import { Genre } from './graphql/types.js';

export function getPrettyGenre(genre: Genre): string {
  switch(genre){
    case Genre.COMICSERIES_LGBTQ:
      return "LGBTQ+"
    case Genre.COMICSERIES_BL:
      return "BL"
    case Genre.COMICSERIES_GL:
      return "GL"
    case Genre.COMICSERIES_SCI_FI:
      return "Sci-Fi"
    default:
      return genre.split("_").map((word: string) => { return word[0]?.toUpperCase() + word.slice(1).toLowerCase()} ).slice(1).join(" ")
  }
}

export const GenreSet = new Set(Object.values(Genre));

// URL-friendly genre names, e.g. COMICSERIES_SLICE_OF_LIFE <-> slice-of-life
export function getGenreSlug(genre: Genre): string {
  return genre.replace(/^COMICSERIES_/, '').toLowerCase().replace(/_/g, '-');
}

export function getGenreFromSlug(slug?: string): Genre | null {
  if (!slug) return null;
  const genre = `COMICSERIES_${slug.toUpperCase().replace(/-/g, '_')}` as Genre;
  return GenreSet.has(genre) ? genre : null;
}

export function safeGenresArray(genres?: string[]): Genre[] | null {
  if (!genres || !Array.isArray(genres)) return null;
  return genres.filter(genre => GenreSet.has(genre as Genre)).map(genre => genre as Genre);
}