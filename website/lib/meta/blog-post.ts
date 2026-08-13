import { getMetaTags } from "@/lib/seo";
import type { RankedListPost } from "@/app/data/blog/types";

export function getBlogPostMeta(post: RankedListPost) {
  const url = `https://inkverse.co${post.path}`;

  return getMetaTags({
    title: post.seoTitle ?? post.title,
    description: post.description,
    url,
    imageURL: post.heroImage.url,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authorName: post.author.name,
    tags: post.tags,
  });
}

// Rendered as <script type="application/ld+json"> in the route component body
// (not via the meta export — inline scripts in head duplicate on hydration).
export function getBlogPostJsonLd(post: RankedListPost): object[] {
  const url = `https://inkverse.co${post.path}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: post.heroImage.url,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: post.author.name,
        url: post.author.url,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Inkverse',
        url: 'https://inkverse.co',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ink0.inkverse.co/general/inkverse-brandmark-white.png',
        },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: post.entries.length,
      itemListElement: post.entries.map((entry) => ({
        '@type': 'ListItem',
        position: entry.rank,
        name: entry.name,
        url: `${url}#${entry.anchor}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://inkverse.co' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://inkverse.co/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
}
