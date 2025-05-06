enum CreatorImageType {
  AVATAR = "avatar",
}

type CreatorImageVariant = 'large' | 'medium' | 'small';

const variantMap: Record<CreatorImageVariant, string> = {
  large: 'lg',
  medium: 'md',
  small: 'sm',
}

type GetAvatarImageUrlProps = {
  avatarImageAsString: string | null | undefined;
  variant?: CreatorImageVariant;
}

export const getAvatarImageUrl = ({ avatarImageAsString, variant = 'medium' }: GetAvatarImageUrlProps): string | undefined => {
  try {
    if (!avatarImageAsString) { throw new Error('getAvatarImageUrl - avatarImageAsString is null'); }
  
    const avatarImage = JSON.parse(avatarImageAsString) as Record<string, string>;
    const baseUrl = avatarImage['base_url'];
    const imagePath = avatarImage[CreatorImageType.AVATAR + `_${variantMap[variant]}`];

    if (!baseUrl || !imagePath) { throw new Error('getAvatarImageUrl - baseUrl or imagePath is null'); }

    return baseUrl + imagePath;
  } catch (error) {
    console.error('Error parsing avatarImageAsString', error);
    return undefined;
  }
};
