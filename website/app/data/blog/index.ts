import type { RankedListPost } from './types';
import { bestWebtoonsOfAllTime } from './best-webtoons-of-all-time';
import { bestActionWebtoons } from './best-action-webtoons-we-recommend';
import { bestBoysloveWebtoons } from './best-boyslove-webtoons-recommend';
import { bestCanvasWebtoons } from './best-canvas-webtoons-to-read';
import { bestGirlsLoveWebtoons } from './best-girls-love-webtoons-to-read';
import { bestLgbtGayWebtoons } from './best-lgbt-gay-webtoons';
import { bestRomanceWebtoons } from './best-romance-webtoons-to-read';
import { bestSupernaturalWebtoons } from './best-supernatural-webtoons-to-read';
import { bestVampireWebtoons } from './best-vampire-webtoons';

const posts: RankedListPost[] = [
  bestWebtoonsOfAllTime,
  bestActionWebtoons,
  bestBoysloveWebtoons,
  bestCanvasWebtoons,
  bestGirlsLoveWebtoons,
  bestLgbtGayWebtoons,
  bestRomanceWebtoons,
  bestSupernaturalWebtoons,
  bestVampireWebtoons,
];

// keyed by route slug, derived from each post's canonical path
export const structuredPosts: Record<string, RankedListPost> = Object.fromEntries(
  posts.map((post) => [post.path.replace('/blog/', ''), post]),
);

export function getStructuredPost(slug: string | undefined): RankedListPost | undefined {
  return slug ? structuredPosts[slug] : undefined;
}

export type { RankedListPost, RankedEntry, PlatformLink, ImageAsset } from './types';
