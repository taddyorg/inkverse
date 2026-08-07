import { type MetaFunction } from "react-router";
import { Link, useSearchParams } from "react-router";
import { getMetaTags } from "@/lib/seo";
import { NotionPage, additionalInfoForNotionId, type BlogPost } from "@inkverse/public/notion";

const INTRO_COPY = "Find your next favourite webtoon, no matter what genre you love.";

const POST_RANKING: string[] = [
  '/blog/best-webtoons-of-all-time',
  '/blog/best-action-webtoons-we-recommend',
  '/blog/best-romance-webtoons-to-read',
  '/blog/best-vampire-webtoons',
  '/blog/best-boyslove-webtoons-recommend',
  '/blog/best-girls-love-webtoons-to-read',
  '/blog/best-lgbt-gay-webtoons',
  '/blog/best-supernatural-webtoons-to-read',
];

interface Accent {
  heading: string;
  card: string;
  shadow: string;
}

const ACCENTS: Accent[] = [
  {
    heading: 'text-brand-pink',
    card: 'border-brand-pink/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-pink)]',
  },
  {
    heading: 'text-brand-purple',
    card: 'border-brand-purple/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-purple)]',
  },
  {
    heading: 'text-taddy-blue',
    card: 'border-taddy-blue/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.taddy-blue)]',
  },
  {
    heading: 'text-action-green',
    card: 'border-action-green/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.action-green)]',
  },
];

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

type IndexPost = BlogPost & { path: string };

const BLOG_POSTS: IndexPost[] = Object.values(NotionPage)
  .filter((page) => page.path.startsWith('/blog/'))
  .map((page) => ({ path: page.path, ...additionalInfoForNotionId[page.path] }))
  .filter((post) => post.title && post.imageURL)
  .sort((a, b) => {
    const rankA = POST_RANKING.indexOf(a.path);
    const rankB = POST_RANKING.indexOf(b.path);
    if (rankA !== -1 || rankB !== -1) {
      return (rankA === -1 ? POST_RANKING.length : rankA) - (rankB === -1 ? POST_RANKING.length : rankB);
    }
    return Number(b.priority) - Number(a.priority);
  });

const ALL_TAGS: string[] = [...new Set(BLOG_POSTS.flatMap((post) => post.tags ?? []))].sort();

const SPECIAL_TAG_LABELS: Record<string, string> = {
  'lgbtq': 'LGBTQ+',
  'sci-fi': 'Sci-Fi',
};

function formatTag(tag: string): string {
  return SPECIAL_TAG_LABELS[tag]
    ?? tag.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "Blog",
    description: INTRO_COPY,
    url: "https://inkverse.co/blog",
    imageURL: additionalInfoForNotionId[NotionPage.BEST_WEBTOONS_OF_ALL_TIME.path].imageURL,
  });
};

function Hero() {
  return (
    <section className="px-4 pt-12 pb-8 sm:pt-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-black leading-tight text-inkverse-black dark:text-white">
          Inkverse <span className="text-brand-pink">Blog</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-inkverse-black/80 dark:text-white/80">
          {INTRO_COPY}
        </p>
      </div>
    </section>
  );
}

function TagFilterBar({ activeTag, onSelectTag }: { activeTag: string | null; onSelectTag: (tag: string | null) => void }) {
  return (
    <section className="px-4 pb-4">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
        {[null, ...ALL_TAGS].map((tag) => {
          const isActive = tag === activeTag;
          return (
            <button
              key={tag ?? 'all'}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectTag(tag)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                isActive
                  ? 'border-brand-pink bg-brand-pink text-white'
                  : 'border-inkverse-black/20 text-inkverse-black hover:border-brand-pink/60 dark:border-white/30 dark:text-white dark:hover:border-brand-pink'
              }`}
            >
              {tag ? formatTag(tag) : 'All'}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PostGrid({ posts, onSelectTag }: { posts: IndexPost[]; onSelectTag: (tag: string | null) => void }) {
  return (
    <section className="px-4 py-8 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 sm:grid-cols-2">
          {posts.map((post, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <Link
                key={post.path}
                to={post.path}
                className={`group flex flex-col overflow-hidden rounded-2xl border-2 bg-white/60 dark:bg-[#FFF4EF] ${accent.card} ${accent.shadow}`}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.imageURL}
                    alt={post.title}
                    loading={index < 2 ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className={`text-xl font-extrabold ${accent.heading}`}>{post.title}</h2>
                  <p className="text-sm leading-relaxed text-inkverse-black/80">{post.description}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectTag(tag);
                          }}
                          className="rounded-full bg-inkverse-black/10 px-2.5 py-0.5 text-xs font-semibold text-inkverse-black/70 transition-colors hover:bg-brand-pink hover:text-white"
                        >
                          {formatTag(tag)}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="mt-auto pt-2 text-sm font-bold text-inkverse-black">
                    Read more
                    <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ activeTag, onClear }: { activeTag: string; onClear: () => void }) {
  return (
    <section className="px-4 py-16 pb-24 text-center">
      <p className="text-lg text-inkverse-black/80 dark:text-white/80">
        No posts tagged "{formatTag(activeTag)}" yet.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-full border-2 border-brand-pink bg-brand-pink px-4 py-1.5 text-sm font-bold text-white"
      >
        Show all posts
      </button>
    </section>
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');

  const onSelectTag = (tag: string | null) => {
    setSearchParams(tag ? { tag } : {}, { preventScrollReset: true });
  };

  const visiblePosts = activeTag
    ? BLOG_POSTS.filter((post) => post.tags?.includes(activeTag))
    : BLOG_POSTS;

  return (
    <div className="min-h-screen text-inkverse-black dark:text-white">
      <main>
        <Hero />
        <TagFilterBar activeTag={activeTag} onSelectTag={onSelectTag} />
        {activeTag && visiblePosts.length === 0 ? (
          <EmptyState activeTag={activeTag} onClear={() => onSelectTag(null)} />
        ) : (
          <PostGrid posts={visiblePosts} onSelectTag={onSelectTag} />
        )}
      </main>
    </div>
  );
}
