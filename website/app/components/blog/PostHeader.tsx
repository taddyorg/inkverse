import { Link } from "react-router";
import type { RankedListPost } from "@/app/data/blog/types";
import { formatTag } from "@/app/data/blog/tags";

function prettyDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PostHeader({ post }: { post: RankedListPost }) {
  return (
    <header className="pt-8 sm:pt-12">
      <nav aria-label="Breadcrumb" className="text-sm font-semibold text-inkverse-black/60 dark:text-white/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" className="hover:text-brand-pink">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/blog" className="hover:text-brand-pink">Blog</Link></li>
        </ol>
      </nav>

      <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight text-inkverse-black dark:text-white">
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-inkverse-black/70 dark:text-white/70">
        <span>
          By{' '}
          <a href={post.author.url} target="_blank" rel="noopener noreferrer" className="font-bold text-inkverse-black dark:text-white hover:text-brand-pink dark:hover:text-brand-pink">
            {post.author.name}
          </a>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Updated <time dateTime={post.updatedAt}>{prettyDate(post.updatedAt)}</time>
        </span>
      </div>
    </header>
  );
}
