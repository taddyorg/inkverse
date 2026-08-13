import { additionalInfoForNotionId } from '@inkverse/public/notion';
import type { RankedListPost } from './types';

type InheritedFields = Pick<
  RankedListPost,
  'path' | 'title' | 'description' | 'author' | 'tags' | 'heroImage'
>;

/** Metadata a post inherits from packages/public. Spread it, then override anything below. */
export function fromNotionPage(page: { path: string }): InheritedFields {
  const info = additionalInfoForNotionId[page.path];
  if (!info?.title || !info.description || !info.imageURL || !info.author) {
    throw new Error(`Missing blog metadata in additionalInfoForNotionId for ${page.path}`);
  }

  return {
    path: page.path,
    title: info.title,
    description: info.description,
    author: info.author,
    tags: info.tags ?? [],
    // alt and dimensions aren't in notion; override heroImage if a banner isn't 1600x900
    heroImage: { url: info.imageURL, alt: info.title, width: 1600, height: 900 },
  };
}
