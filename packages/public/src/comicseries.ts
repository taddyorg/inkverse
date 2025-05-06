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
