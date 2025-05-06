enum ComicIssueImageType {
  BANNER = "banner",
  THUMBNAIL = "thumbnail",
}

type ComicIssueImageVariant = 'large' | 'medium' | 'small';

const variantMap: Record<ComicIssueImageVariant, string> = {
  large: 'lg',
  medium: 'md',
  small: 'sm',
}

type GetBannerImageUrlProps = {
  bannerImageAsString: string | null | undefined;
  variant?: ComicIssueImageVariant;
}

export const getBannerImageUrl = ({ bannerImageAsString, variant = 'medium' }: GetBannerImageUrlProps): string | undefined => {
  try {
    if (!bannerImageAsString) { throw new Error('getBannerImageUrl - bannerImageAsString is null'); }

    const bannerImage = JSON.parse(bannerImageAsString) as Record<string, string>;

    const baseUrl = bannerImage['base_url'];
    const imagePath = bannerImage[ComicIssueImageType.BANNER + `_${variantMap[variant]}`];

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
    const imagePath = thumbnailImage[ComicIssueImageType.THUMBNAIL];

    if (!baseUrl || !imagePath) { throw new Error('getThumbnailImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing thumbnailImageAsString', error);
    return undefined;
  }
};
