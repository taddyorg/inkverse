export const inkverseWebsiteUrl = process.env.NODE_ENV === 'production' 
	? 'https://inkverse.co' 
	: 'http://inkverse.test:8082';

export function isAValidEmail(email: string): boolean {
  return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email);
}

export function isValidHttpUrl(potentialUrl: string): boolean {
  try {
    const url = new URL(potentialUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
  
export const arrayToObject = <T extends Record<K, PropertyKey>, K extends keyof T>(
  array: T[],
  keyField: K
): Record<T[K], T> =>
  array.reduce((obj, item) => {
    obj[item[keyField]] = item;
    return obj;
}, {} as Record<T[K], T>);


export type InkverseUrlType = 'comicseries' | 'comicissue' | 'creator' | 'list' | 'search' | 'share-inkverse' | 'tag' | 'genre' | 'profile';

export type InkverseUrlParams = {
  type: InkverseUrlType,
  shortUrl?: string | null,
  name?: string | null,
  uuid?: string | null,
  id?: string | null,
  term?: string | null,
  types?: string[] | null
}

function safeName(name: string | null): string {
  return name?.trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .toLowerCase() || '';
}

export function getInkverseUrl(
  params: InkverseUrlParams
): string | undefined {
  switch (params.type) {
    case 'comicseries':
      if (!params.shortUrl) return undefined;
      return `/comics/${params.shortUrl}`;

    case 'creator':
      if (!params.shortUrl) return undefined;
      return `/creators/${params.shortUrl}`;

    case 'comicissue':
      if (!params.shortUrl || !params.name || !params.uuid) return undefined;
      return `/comics/${params.shortUrl}/${safeName(params.name)}-${params.uuid}`;

    case 'list':
      if (!params.id || !params.name) return undefined;
      return `/lists/id${params.id}-${safeName(params.name)}`;

    case 'search':
      if (!params.term || !params.types) return undefined;
      return `/search/${params.term}/${params.types.join(',')}`;

    case 'tag':
      if (!params.name) return undefined;
      return `/tagged/${params.name}`;

    case 'genre':
      if (!params.name) return undefined;
      return `/genre/${params.name}`;
    
    case 'share-inkverse':
      return '/';

    case 'profile':
      if (!params.shortUrl) return undefined;
      return `/${params.shortUrl}`;

  default:
    throw new Error('getInkverseLink - type is invalid');
  }
}