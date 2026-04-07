import { ApolloClient } from '@apollo/client';
import type { Dispatch } from 'react';
import {
  GetNotificationFeed,
  type GetNotificationFeedQuery,
  type GetNotificationFeedQueryVariables,
  NotificationTimeBucket,
} from '../graphql/operations.js';

type NotificationFeed = NonNullable<GetNotificationFeedQuery['getNotificationsForUser']>;
export type NotificationSection = NotificationFeed['sections'][number];
export type NotificationFeedItem = NotificationSection['items'][number];

export { NotificationTimeBucket };

const BUCKET_ORDER = [
  NotificationTimeBucket.TODAY,
  NotificationTimeBucket.THIS_WEEK,
  NotificationTimeBucket.THIS_MONTH,
  NotificationTimeBucket.EARLIER,
] as const;

// Initial load fetches only recent buckets in a single request
const INITIAL_BUCKETS = [NotificationTimeBucket.TODAY, NotificationTimeBucket.THIS_WEEK];
// Remaining buckets are fetched on-demand via "load more"
const REMAINING_BUCKETS = [NotificationTimeBucket.THIS_MONTH, NotificationTimeBucket.EARLIER];

/* Action Type Enum */
export enum NotificationsActionType {
  LOAD_NOTIFICATIONS_START = 'LOAD_NOTIFICATIONS_START',
  LOAD_NOTIFICATIONS_SUCCESS = 'LOAD_NOTIFICATIONS_SUCCESS',
  LOAD_NOTIFICATIONS_ERROR = 'LOAD_NOTIFICATIONS_ERROR',
  LOAD_MORE_NOTIFICATIONS_START = 'LOAD_MORE_NOTIFICATIONS_START',
  LOAD_MORE_NOTIFICATIONS_SUCCESS = 'LOAD_MORE_NOTIFICATIONS_SUCCESS',
  LOAD_MORE_NOTIFICATIONS_ERROR = 'LOAD_MORE_NOTIFICATIONS_ERROR',
  RESET = 'RESET',
}

export type NotificationsAction =
  | { type: NotificationsActionType.LOAD_NOTIFICATIONS_START }
  | { type: NotificationsActionType.LOAD_NOTIFICATIONS_SUCCESS; payload: { sections: NotificationSection[]; currentBucketIndex: number; currentOffset: number; hasMore: boolean } }
  | { type: NotificationsActionType.LOAD_NOTIFICATIONS_ERROR; payload: string }
  | { type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_START }
  | { type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_SUCCESS; payload: { sections: NotificationSection[]; currentBucketIndex: number; currentOffset: number; hasMore: boolean } }
  | { type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_ERROR; payload: string }
  | { type: NotificationsActionType.RESET };

export type NotificationsState = {
  isLoading: boolean;
  isLoadingMore: boolean;
  sections: NotificationSection[];
  currentBucketIndex: number;
  currentOffset: number;
  hasMore: boolean;
  error: string | null;
};

export const notificationsInitialState: NotificationsState = {
  isLoading: false,
  isLoadingMore: false,
  sections: [],
  currentBucketIndex: 0,
  currentOffset: 0,
  hasMore: true,
  error: null,
};

type LoadNotificationsProps = {
  userClient: ApolloClient;
  limit?: number;
  forceRefresh?: boolean;
};

async function fetchBuckets(
  userClient: ApolloClient,
  buckets: NotificationTimeBucket[],
  limit: number,
  offset: number,
  forceRefresh: boolean
): Promise<NotificationSection[]> {
  const result = await userClient.query<GetNotificationFeedQuery, GetNotificationFeedQueryVariables>({
    query: GetNotificationFeed,
    variables: { buckets, limit, offset },
    ...(forceRefresh && { fetchPolicy: 'network-only' }),
  });

  return result.data?.getNotificationsForUser?.sections || [];
}

export async function loadNotifications(
  { userClient, limit = 50, forceRefresh = false }: LoadNotificationsProps,
  dispatch?: Dispatch<NotificationsAction>
): Promise<NotificationSection[] | null> {
  if (dispatch) dispatch({ type: NotificationsActionType.LOAD_NOTIFICATIONS_START });

  try {
    // Fetch TODAY + THIS_WEEK in a single request (server processes in parallel)
    const sections = await fetchBuckets(userClient, INITIAL_BUCKETS, limit, 0, forceRefresh);

    // Check if any initial bucket is full (has more items to paginate)
    let nextBucketIndex = INITIAL_BUCKETS.length; // default: move past initial buckets
    let nextOffset = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section && section.items.length >= limit) {
        // This bucket is full — "load more" should paginate within it first
        const fullBucketIndex = BUCKET_ORDER.indexOf(section.bucket);
        if (fullBucketIndex >= 0) {
          nextBucketIndex = fullBucketIndex;
          nextOffset = section.items.length;
          break;
        }
      }
    }

    const hasMore = nextOffset > 0 || nextBucketIndex < BUCKET_ORDER.length;

    if (dispatch) {
      dispatch({
        type: NotificationsActionType.LOAD_NOTIFICATIONS_SUCCESS,
        payload: {
          sections,
          currentBucketIndex: nextBucketIndex,
          currentOffset: nextOffset,
          hasMore,
        },
      });
    }

    return sections;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to load notifications';
    if (dispatch) {
      dispatch({ type: NotificationsActionType.LOAD_NOTIFICATIONS_ERROR, payload: errorMessage });
    }
    return null;
  }
}

type LoadMoreNotificationsProps = {
  userClient: ApolloClient;
  limit?: number;
  currentBucketIndex: number;
  currentOffset: number;
};

export async function loadMoreNotifications(
  { userClient, limit = 50, currentBucketIndex, currentOffset }: LoadMoreNotificationsProps,
  dispatch?: Dispatch<NotificationsAction>
): Promise<NotificationSection[] | null> {
  if (dispatch) dispatch({ type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_START });

  try {
    const newSections: NotificationSection[] = [];
    let bucketIndex = currentBucketIndex;
    let offset = currentOffset;

    // Fetch from current position, skipping empty buckets
    while (bucketIndex < BUCKET_ORDER.length) {
      const bucket = BUCKET_ORDER[bucketIndex];
      if (!bucket) break;
      const sections = await fetchBuckets(userClient, [bucket], limit, offset, true);
      const section = sections[0];

      if (section) {
        newSections.push(section);
        if (section.items.length >= limit) {
          // This bucket might have more — stop here
          break;
        }
      }

      // Move to next bucket
      bucketIndex++;
      offset = 0;
    }

    // Determine pagination state
    const lastSection = newSections.length > 0 ? newSections[newSections.length - 1] : null;
    const lastItemCount = lastSection ? lastSection.items.length : 0;
    const bucketFull = lastItemCount >= limit;
    const stoppedAtIndex = Math.min(bucketIndex, BUCKET_ORDER.length - 1);

    const nextBucketIndex = bucketFull ? stoppedAtIndex : stoppedAtIndex + 1;
    const nextOffset = bucketFull ? currentOffset + lastItemCount : 0;
    const hasMore = bucketFull || nextBucketIndex < BUCKET_ORDER.length;

    if (dispatch) {
      dispatch({
        type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_SUCCESS,
        payload: {
          sections: newSections,
          currentBucketIndex: nextBucketIndex,
          currentOffset: nextOffset,
          hasMore,
        },
      });
    }

    return newSections;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to load more notifications';
    if (dispatch) {
      dispatch({ type: NotificationsActionType.LOAD_MORE_NOTIFICATIONS_ERROR, payload: errorMessage });
    }
    return null;
  }
}

function mergeSections(existing: NotificationSection[], incoming: NotificationSection[]): NotificationSection[] {
  const merged = [...existing];
  for (const newSection of incoming) {
    const existingIndex = merged.findIndex(s => s.bucket === newSection.bucket);
    if (existingIndex >= 0) {
      const existingSection = merged[existingIndex];
      if (!existingSection) continue;
      merged[existingIndex] = {
        ...existingSection,
        items: [...existingSection.items, ...newSection.items],
      };
    } else {
      merged.push(newSection);
    }
  }
  return merged;
}

export function notificationsReducer(
  state: NotificationsState = notificationsInitialState,
  action: NotificationsAction
): NotificationsState {
  switch (action.type) {
    case NotificationsActionType.LOAD_NOTIFICATIONS_START:
      return { ...state, isLoading: true, error: null };
    case NotificationsActionType.LOAD_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        sections: action.payload.sections,
        currentBucketIndex: action.payload.currentBucketIndex,
        currentOffset: action.payload.currentOffset,
        hasMore: action.payload.hasMore,
        error: null,
      };
    case NotificationsActionType.LOAD_NOTIFICATIONS_ERROR:
      return { ...state, isLoading: false, error: action.payload };
    case NotificationsActionType.LOAD_MORE_NOTIFICATIONS_START:
      return { ...state, isLoadingMore: true };
    case NotificationsActionType.LOAD_MORE_NOTIFICATIONS_SUCCESS:
      return {
        ...state,
        isLoadingMore: false,
        sections: mergeSections(state.sections, action.payload.sections),
        currentBucketIndex: action.payload.currentBucketIndex,
        currentOffset: action.payload.currentOffset,
        hasMore: action.payload.hasMore,
      };
    case NotificationsActionType.LOAD_MORE_NOTIFICATIONS_ERROR:
      return { ...state, isLoadingMore: false, error: action.payload };
    case NotificationsActionType.RESET:
      return notificationsInitialState;
    default:
      return state;
  }
}
