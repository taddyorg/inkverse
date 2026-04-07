export type DigestTotals = {
  episodeLikes: number;
  episodeComments: number;
};

export function computeDigestTotals(
  items: { eventType: string; count: number }[]
): DigestTotals {
  const episodeLikes = items
    .filter(d => d.eventType === 'CREATOR_EPISODE_LIKED')
    .reduce((sum, d) => sum + d.count, 0);
  const episodeComments = items
    .filter(d => d.eventType === 'CREATOR_EPISODE_COMMENTED')
    .reduce((sum, d) => sum + d.count, 0);
  return { episodeLikes, episodeComments };
}

function formatParts(totals: DigestTotals, bold: (s: string) => string): string[] {
  const parts: string[] = [];
  if (totals.episodeLikes > 0) parts.push(`${bold(`${totals.episodeLikes} ${totals.episodeLikes > 1 ? 'people' : 'person'}`)} ${totals.episodeLikes > 1 ? 'have' : 'has'} liked an episode`);
  if (totals.episodeComments > 0) parts.push(`${bold(`${totals.episodeComments} ${totals.episodeComments > 1 ? 'people' : 'person'}`)} ${totals.episodeComments > 1 ? 'have' : 'has'} left a comment or reply on your comic`);
  return parts;
}

function joinParts(parts: string[]): string {
  return parts.join(', ').replace(/, ([^,]*)$/, ', and $1');
}

export function getDigestText(totals: DigestTotals): {
  title: string;
  body: string;
  bodyHtml: string;
} {
  const title = 'Yay! Your fans are showing you some love!';
  const plainParts = formatParts(totals, s => s);
  const htmlParts = formatParts(totals, s => `<strong>${s}</strong>`);
  return {
    title,
    body: `${joinParts(plainParts)} on Inkverse.`,
    bodyHtml: `${joinParts(htmlParts)} on Inkverse.`,
  };
}
