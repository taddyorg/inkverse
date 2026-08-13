const SPECIAL_TAG_LABELS: Record<string, string> = {
  'lgbtq': 'LGBTQ+',
  'sci-fi': 'Sci-Fi',
};

export function formatTag(tag: string): string {
  return SPECIAL_TAG_LABELS[tag]
    ?? tag.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
