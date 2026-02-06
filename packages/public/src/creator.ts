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

// Format creator names: "Alice", "Alice and Bob", "Alice, Bob, and Charlie"
export function formatCreatorNames(creators?: ({ name?: string | null } | null)[]): string {
  const names = creators?.map(c => c?.name).filter((name): name is string => !!name) ?? [];
  if (names.length === 0) return 'the creators';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
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
