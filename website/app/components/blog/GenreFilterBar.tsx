import type { RankedEntry } from "@/app/data/blog/types";

export function getGenreFilters(entries: RankedEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const genre of entry.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count < entries.length)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([genre]) => genre);
}

export function GenreFilterBar({ genres, activeGenre, onSelectGenre }: {
  genres: string[];
  activeGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
}) {
  const pills = activeGenre && !genres.includes(activeGenre) ? [...genres, activeGenre] : genres;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {[null, ...pills].map((genre) => {
        const isActive = genre === activeGenre;
        return (
          <button
            key={genre ?? 'all'}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectGenre(genre)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              isActive
                ? 'border-brand-pink bg-brand-pink text-white'
                : 'border-inkverse-black/20 text-inkverse-black hover:border-brand-pink/60 dark:border-white/30 dark:text-white dark:hover:border-brand-pink'
            }`}
          >
            {genre ?? 'All'}
          </button>
        );
      })}
    </div>
  );
}
