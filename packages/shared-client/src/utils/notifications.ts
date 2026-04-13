import type { NotificationFeedItem } from '../dispatch/notifications';
import { prettyFormattedDate } from './date';

export function relativeTimeFromEpoch(epoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - epoch;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return prettyFormattedDate(new Date(epoch * 1000));
}

export function bucketLabel(bucket: string): string {
  switch (bucket) {
    case 'TODAY': return 'Today';
    case 'THIS_WEEK': return 'This Week';
    case 'THIS_MONTH': return 'This Month';
    case 'EARLIER': return 'Earlier';
    default: return bucket;
  }
}

export function getCreatedAt(item: NotificationFeedItem): number {
  if (item.__typename === 'AggregatedNotification') {
    return item.latestCreatedAt;
  }
  return (item as Extract<NotificationFeedItem, { __typename?: 'Notification' }>).createdAt;
}

export function getNotificationText(item: NotificationFeedItem): string {
  if (item.__typename === 'AggregatedNotification') {
    const comicSeriesName = item.parentItem?.comicSeries?.name || '';
    const comicIssueName = item.targetItem?.comicIssue?.name || '';
    switch (item.eventType) {
      case 'CREATOR_EPISODE_LIKED':
        return `${item.count} ${item.count === 1 ? 'person' : 'people'} liked${comicIssueName ? ` ${comicIssueName}` : ''}${comicSeriesName ? ` from ${comicSeriesName}` : ''}`;
      case 'CREATOR_EPISODE_COMMENTED':
        return `${item.count} new ${item.count === 1 ? 'comment' : 'comments'} on${comicIssueName ? ` ${comicIssueName}` : ''}${comicSeriesName ? ` from ${comicSeriesName}` : ''}`;
      case 'COMMENT_LIKED':
        return `${item.count} ${item.count === 1 ? 'person' : 'people'} liked your comment${comicSeriesName ? ` on ${comicSeriesName}` : ''}`;
      default:
        return `${item.count} new notifications`;
    }
  }

  if (item.__typename !== 'Notification') return 'New notification';

  const actorName = item.actor?.username || 'Someone';
  const comicSeriesName = item.parentItem?.comicSeries?.name || '';

  switch (item.eventType) {
    case 'NEW_EPISODE_RELEASED':
      return `New episode of ${comicSeriesName || 'a series you follow'} is now available`;
    case 'COMMENT_REPLY':
      return `${actorName} replied to your comment${comicSeriesName ? ` on ${comicSeriesName}` : ''}`;
    default:
      return 'New notification';
  }
}
