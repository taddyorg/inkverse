import { useSearchParams } from "react-router";

import type { RankedListPost } from "@/app/data/blog/types";
import { getBlogPostJsonLd } from "@/lib/meta/blog-post";
import { ACCENTS } from "./accents";
import { GenreFilterBar, getGenreFilters } from "./GenreFilterBar";
import { PostHeader } from "./PostHeader";
import { RankedEntryCard } from "./RankedEntryCard";
import { AppDownloadCTA } from "./AppDownloadCTA";
import { RecapList } from "./RecapList";
import { RelatedPosts } from "./RelatedPosts";
import { Footer } from "../ui/Footer";

const INLINE_CTA_AFTER_ENTRY = 5;

export function RankedListPostPage({ post }: { post: RankedListPost }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGenre = searchParams.get('genre');
  const onSelectGenre = (genre: string | null) => {
    setSearchParams(genre ? { genre } : {}, { preventScrollReset: true });
  };
  const genreFilters = getGenreFilters(post.entries);
  const visibleEntries = activeGenre
    ? post.entries.filter((entry) => entry.genres.includes(activeGenre))
    : post.entries;
  const hasSections = visibleEntries.some((entry) => entry.section);

  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      {getBlogPostJsonLd(post).map((jsonLd, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ))}
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        <article>
          <PostHeader post={post} />

          <div className={`mt-8 overflow-hidden rounded-2xl border-2 ${ACCENTS[0].card} ${ACCENTS[0].shadow}`}>
            <img
              src={post.heroImage.url}
              alt={post.heroImage.alt}
              width={post.heroImage.width}
              height={post.heroImage.height}
              loading="eager"
              fetchPriority="high"
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="mt-8 space-y-4">
            {post.intro.map((paragraph, i) => (
              <p key={i} className="text-lg leading-relaxed text-inkverse-black/80 dark:text-white/80">
                {paragraph}
              </p>
            ))}
          </div>

          {activeGenre && visibleEntries.length === 0 ? (
            <div className="mt-14 text-center">
              <p className="text-lg text-inkverse-black/80 dark:text-white/80">
                No picks tagged "{activeGenre}" yet.
              </p>
              <button
                type="button"
                onClick={() => onSelectGenre(null)}
                className="mt-6 rounded-full border-2 border-brand-pink bg-brand-pink px-4 py-1.5 text-sm font-bold text-white"
              >
                Show all picks
              </button>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <RecapList entries={visibleEntries}>
                  {genreFilters.length > 0 && (
                    <GenreFilterBar genres={genreFilters} activeGenre={activeGenre} onSelectGenre={onSelectGenre} />
                  )}
                </RecapList>
              </div>

              {!hasSections && (
                <h2 className="mt-14 text-2xl font-black text-inkverse-black dark:text-white">
                  Deep dive into every webtoon:
                </h2>
              )}

              <div className={`${hasSections ? 'mt-14' : 'mt-8'} space-y-10`}>
                {visibleEntries.map((entry, index) => (
                  <div key={entry.anchor} className="space-y-10">
                    {entry.section && entry.section !== visibleEntries[index - 1]?.section && (
                      <h2 className="text-2xl font-black text-inkverse-black dark:text-white">
                        {entry.section}
                      </h2>
                    )}
                    <RankedEntryCard
                      entry={entry}
                      accent={ACCENTS[(entry.rank - 1) % ACCENTS.length]}
                      onSelectGenre={onSelectGenre}
                    />
                    {index === INLINE_CTA_AFTER_ENTRY - 1 && visibleEntries.length > INLINE_CTA_AFTER_ENTRY && (
                      <AppDownloadCTA variant="inline" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {post.outro && (
            <div className="mt-10 space-y-4">
              {post.outro.map((paragraph, i) => (
                <p key={i} className="text-lg leading-relaxed text-inkverse-black/80 dark:text-white/80">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="mt-12">
            <AppDownloadCTA variant="full" />
          </div>
        </article>

        <div className="mt-14 mb-16">
          <RelatedPosts currentPath={post.path} tags={post.tags} relatedPosts={post.relatedPosts} />
        </div>
      </main>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}
