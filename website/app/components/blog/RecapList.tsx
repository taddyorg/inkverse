import type { ReactNode } from "react";
import type { RankedEntry } from "@/app/data/blog/types";

export function RecapList({ entries, children }: { entries: RankedEntry[]; children?: ReactNode }) {
  return (
    <section aria-labelledby="recap-title">
      {children && <div className="mt-4">{children}</div>}
      <ol className="mt-4 space-y-2">
        {entries.map((entry) => (
          <li key={entry.anchor} className="text-base leading-relaxed text-inkverse-black/80 dark:text-white/80">
            <span className="font-bold text-inkverse-black dark:text-white">{entry.rank}.</span>{' '}
            <a href={`#${entry.anchor}`} className="font-semibold text-inkverse-black dark:text-white underline decoration-2 decoration-brand-pink/50 underline-offset-2 hover:decoration-brand-pink">
              {entry.name}
            </a>
            {' '}— {entry.genres.join(', ')}
          </li>
        ))}
      </ol>
    </section>
  );
}
