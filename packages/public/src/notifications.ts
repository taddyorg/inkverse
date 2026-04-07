import { NotificationEventType } from '@inkverse/public/graphql/types';

export const NOTIFICATION_DEFAULTS: Record<NotificationEventType, { PUSH: boolean; EMAIL: boolean }> = {
  NEW_EPISODE_RELEASED: { PUSH: true, EMAIL: false },
  COMMENT_REPLY: { PUSH: true, EMAIL: false },
  COMMENT_LIKED: { PUSH: true, EMAIL: false },
  CREATOR_EPISODE_LIKED: { PUSH: true, EMAIL: true },
  CREATOR_EPISODE_COMMENTED: { PUSH: true, EMAIL: true },
};
