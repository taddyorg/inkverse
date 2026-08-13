import type { RankedEntry } from "@/app/data/blog/types";
import type { Accent } from "./accents";

function StatusBadge({ status }: { status: NonNullable<RankedEntry['status']> }) {
  const dotColors: Record<NonNullable<RankedEntry['status']>, string> = {
    'Ongoing': 'bg-action-green',
    'Completed': 'bg-taddy-blue',
    'Hiatus': 'bg-inkverse-black/50',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-inkverse-black/70">
      <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${dotColors[status]}`} />
      {status}
    </span>
  );
}

function CoverArt({ entry, accent }: { entry: RankedEntry; accent: Accent }) {
  if (entry.coverImage) {
    return (
      <img
        src={entry.coverImage.url}
        alt={entry.coverImage.alt}
        width={entry.coverImage.width}
        height={entry.coverImage.height}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent.gradient}`}>
      <span className="text-7xl font-black text-white/40 select-none">#{entry.rank}</span>
    </div>
  );
}

export function RankedEntryCard({ entry, accent, onSelectGenre }: { entry: RankedEntry; accent: Accent; onSelectGenre?: (genre: string) => void }) {
  return (
    <section id={entry.anchor} aria-labelledby={`${entry.anchor}-title`} className="scroll-mt-24">
      <div className={`overflow-hidden rounded-2xl border-2 bg-white/60 dark:bg-[#FFF4EF] ${accent.card} ${accent.shadow}`}>
        <div className="aspect-[16/9] overflow-hidden">
          <CoverArt entry={entry} accent={accent} />
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6 text-inkverse-black">
          <h2 id={`${entry.anchor}-title`} className={`text-2xl sm:text-3xl font-extrabold ${accent.heading}`}>
            {entry.rank}. {entry.name}
          </h2>

          <div className="flex flex-wrap items-center gap-1.5">
            {entry.genres.map((genre) =>
              onSelectGenre ? (
                <button
                  key={genre}
                  type="button"
                  onClick={() => onSelectGenre(genre)}
                  className="rounded-full bg-inkverse-black/10 px-2.5 py-0.5 text-xs font-semibold text-inkverse-black/70 transition-colors hover:bg-brand-pink hover:text-white"
                >
                  {genre}
                </button>
              ) : (
                <span key={genre} className="rounded-full bg-inkverse-black/10 px-2.5 py-0.5 text-xs font-semibold text-inkverse-black/70">
                  {genre}
                </span>
              )
            )}
            {(entry.status || entry.episodeCount) && (
              <span className="ml-1 inline-flex items-center gap-1.5">
                {entry.status && <StatusBadge status={entry.status} />}
                {entry.episodeCount && (
                  <>
                    {entry.status && <span aria-hidden="true" className="text-xs text-inkverse-black/40">·</span>}
                    <span className="text-xs font-semibold text-inkverse-black/60">
                      {entry.episodeCount} episodes
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-inkverse-black/60">Synopsis</h3>
            {entry.synopsis.map((paragraph, i) => (
              <p key={i} className="mt-1.5 text-sm leading-relaxed text-inkverse-black/80">{paragraph}</p>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-inkverse-black/60">
              {entry.whyHeading ?? 'Why you should read it'}
            </h3>
            {entry.whyReadIt.map((paragraph, i) => (
              <p key={i} className="mt-1.5 text-sm leading-relaxed text-inkverse-black/80">{paragraph}</p>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {entry.readOn.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-inkverse-black/20 px-3.5 py-1.5 text-sm font-bold text-inkverse-black transition-colors hover:border-brand-pink hover:text-brand-pink"
              >
                Read on {link.label}
                <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            ))}
            {entry.watchOn?.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-inkverse-black/20 px-3.5 py-1.5 text-sm font-bold text-inkverse-black/70 transition-colors hover:border-brand-purple hover:text-brand-purple"
              >
                Watch on {link.label}
                <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
