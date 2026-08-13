export interface ImageAsset {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PlatformLink {
  label: string;
  url: string;
}

export interface RankedEntry {
  rank: number;
  name: string;
  /** heading id, used for jump links and ItemList urls, e.g. 'solo-leveling' */
  anchor: string;
  synopsis: string[];
  whyReadIt: string[];
  /** defaults to "Why you should read it" */
  whyHeading?: string;
  genres: string[];
  /** omit when the source post never stated it — the card hides the badge */
  status?: 'Ongoing' | 'Completed' | 'Hiatus';
  episodeCount?: string;
  readOn: PlatformLink[];
  watchOn?: PlatformLink[];
  coverImage?: ImageAsset;
  /**
   * group heading this entry appears under, e.g. 'Hidden Gems'.
   * Entries in the same group must share the exact string; omit for flat posts.
   * The page renders a heading whenever section differs from the previous visible entry's.
   */
  section?: string;
}

export interface RankedListPost {
  /**
   * canonical identifier — must match the NotionPage path exactly,
   * e.g. '/blog/best-webtoons-of-all-time'. The route slug is derived from it.
   */
  path: string;
  title: string;
  /** overrides the <title> tag if set */
  seoTitle?: string;
  description: string;
  /** ISO date, e.g. '2026-04-10' */
  publishedAt: string;
  updatedAt: string;
  author: { name: string; url: string };
  tags: string[];
  heroImage: ImageAsset;
  intro: string[];
  entries: RankedEntry[];
  outro?: string[];
  /** hand-picked "Keep reading" posts, e.g. [NotionPage.BEST_ACTION_WEBTOONS]; falls back to tag overlap when omitted */
  relatedPosts?: { id: string; path: string }[];
}
