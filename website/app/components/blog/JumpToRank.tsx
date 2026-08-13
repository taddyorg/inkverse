import type { RankedEntry } from "@/app/data/blog/types";

export function JumpToRank({ entries }: { entries: RankedEntry[] }) {
  return (
    <nav aria-label="Revisit a pick">
      <h2 className="text-sm font-black uppercase tracking-wide text-inkverse-black/60 dark:text-white/60">
        Revisit a pick
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => (
          <a
            key={entry.anchor}
            href={`#${entry.anchor}`}
            className="rounded-full border-2 border-inkverse-black/20 px-3 py-1 text-sm font-bold text-inkverse-black transition-colors hover:border-brand-pink hover:text-brand-pink dark:border-white/30 dark:text-white dark:hover:border-brand-pink dark:hover:text-brand-pink"
          >
            {entry.rank}. {entry.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
