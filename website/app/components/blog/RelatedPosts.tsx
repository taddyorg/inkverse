import { Link } from "react-router";
import { getBlogPostListings } from "@inkverse/public/notion";
import { ACCENTS } from "./accents";

interface RelatedPost {
  path: string;
  title: string;
  imageURL: string;
  tags: string[];
}

const ALL_BLOG_POSTS: RelatedPost[] = getBlogPostListings().map((post) => ({
  path: post.path,
  title: post.title ?? '',
  imageURL: post.imageURL ?? '',
  tags: post.tags ?? [],
}));

export function getRelatedPosts(currentPath: string, tags: string[], count = 3): RelatedPost[] {
  return ALL_BLOG_POSTS
    .filter((post) => post.path !== currentPath)
    .map((post) => ({ post, sharedTags: post.tags.filter((tag) => tags.includes(tag)).length }))
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, count)
    .map(({ post }) => post);
}

export function RelatedPosts({ currentPath, tags, relatedPosts }: { currentPath: string; tags: string[]; relatedPosts?: { id: string; path: string }[] }) {
  const related = relatedPosts
    ? relatedPosts
        .map((entry) => ALL_BLOG_POSTS.find((post) => post.path === entry.path))
        .filter((post): post is RelatedPost => !!post)
    : getRelatedPosts(currentPath, tags);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title">
      <h2 id="related-title" className="text-2xl font-black text-inkverse-black dark:text-white">
        Keep reading
      </h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {related.map((post, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <Link
              key={post.path}
              to={post.path}
              className={`group flex flex-col overflow-hidden rounded-2xl border-2 bg-white/60 dark:bg-[#FFF4EF] ${accent.card} ${accent.shadow}`}
            >
              <div className="aspect-video overflow-hidden">
                <img src={post.imageURL} alt={post.title} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className={`text-base font-extrabold ${accent.heading}`}>{post.title}</h3>
                <span className="mt-auto pt-2 text-sm font-bold text-inkverse-black">
                  Read more
                  <span aria-hidden="true" className="ml-1.5 inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
