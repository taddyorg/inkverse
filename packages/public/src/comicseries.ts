enum ComicSeriesImageType {
  COVER = "cover",
  BANNER = "banner",
  THUMBNAIL = "thumbnail",
}

type ComicSeriesImageVariant = 'large' | 'medium' | 'small';

const variantMap: Record<ComicSeriesImageVariant, string> = {
  large: 'lg',
  medium: 'md',
  small: 'sm',
}

type GetCoverImageUrlProps = {
  coverImageAsString: string | null | undefined;
  variant?: ComicSeriesImageVariant;
}

export const getCoverImageUrl = ({ coverImageAsString, variant = 'medium' }: GetCoverImageUrlProps): string | undefined => {
  try {
    if (!coverImageAsString) { throw new Error('getCoverImageUrl - coverImageAsString is null'); }
  
    const coverImage = JSON.parse(coverImageAsString) as Record<string, string>;
    const baseUrl = coverImage['base_url'];
    const imagePath = coverImage[ComicSeriesImageType.COVER + `_${variantMap[variant]}`];

    if (!baseUrl || !imagePath) { throw new Error('getCoverImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing coverImageAsString', error);
    return undefined;
  }
};

type GetBannerImageUrlProps = {
  bannerImageAsString: string | null | undefined;
  variant?: ComicSeriesImageVariant;
}

export const getBannerImageUrl = ({ bannerImageAsString, variant = 'medium' }: GetBannerImageUrlProps): string | undefined => {
  try {
    if (!bannerImageAsString) { throw new Error('getBannerImageUrl - bannerImageAsString is null'); }
  
    const bannerImage = JSON.parse(bannerImageAsString) as Record<string, string>;
    const baseUrl = bannerImage['base_url'];
    const imagePath = bannerImage[ComicSeriesImageType.BANNER + `_${variantMap[variant]}`];

    if (!baseUrl || !imagePath) { throw new Error('getBannerImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing bannerImageAsString', error);
    return undefined;
  }
};

type GetThumbnailImageUrlProps = {
  thumbnailImageAsString: string | null | undefined;
}

export const getThumbnailImageUrl = ({ thumbnailImageAsString }: GetThumbnailImageUrlProps): string | undefined => {
  try {
    if (!thumbnailImageAsString) { throw new Error('getThumbnailImageUrl - thumbnailImageAsString is null'); }
  
    const thumbnailImage = JSON.parse(thumbnailImageAsString) as Record<string, string>;
    const baseUrl = thumbnailImage['base_url'];
    const imagePath = thumbnailImage[ComicSeriesImageType.THUMBNAIL];

    if (!baseUrl || !imagePath) { throw new Error('getThumbnailImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing thumbnailImageAsString', error);
    return undefined;
  }
};

// A tagline is a short 1-3 word descriptor of a comic (e.g. "Romance • Comedy")
export const MAX_TAGLINE_LENGTH = 40;

// One or more words of letters, each separated by a single space or " • "
export const TAGLINE_REGEX = /^\p{L}+(?:(?: • | )\p{L}+)*$/u;
export const TAGLINE_INVALID_MESSAGE = 'Tagline can only contain letters, spaces and •';

// NFC so "é" typed as e + combining accent counts as a letter; collapse whitespace; space out bullets
export function normalizeTagline(tagline: string): string {
  return tagline.normalize('NFC').replace(/\s+/g, ' ').replace(/ ?• ?/g, ' • ').trim();
}

export function isValidTagline(tagline: string): boolean {
  return TAGLINE_REGEX.test(normalizeTagline(tagline));
}
