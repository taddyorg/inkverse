import { database } from '../database/index.js';
import type { NotificationSettingModel } from '../database/types.js';
import { NotificationEventType, NotificationChannel } from '../graphql/types.js';
import { currentDate } from '../utils/date.js';
import { NOTIFICATION_DEFAULTS } from '@inkverse/public/notifications';

export const AGGREGATED_EVENT_TYPES: Set<NotificationEventType> = new Set([
  NotificationEventType.COMMENT_LIKED,
  NotificationEventType.CREATOR_EPISODE_LIKED,
  NotificationEventType.CREATOR_EPISODE_COMMENTED,
]);

export const DIGEST_EVENT_TYPES: Set<NotificationEventType> = new Set([
  NotificationEventType.CREATOR_EPISODE_LIKED,
  NotificationEventType.CREATOR_EPISODE_COMMENTED,
]);

export class NotificationSetting {
  static async getOverridesForUser(userId: number): Promise<Record<string, Record<string, boolean>>> {
    const rows = await database('notification_settings')
      .where({ userId })
      .select('*') as NotificationSettingModel[];

    const overrides: Record<string, Record<string, boolean>> = {};
    for (const row of rows) {
      if (!overrides[row.eventType]) {
        overrides[row.eventType] = {};
      }
      overrides[row.eventType]![row.channel] = row.isEnabled;
    }

    return overrides;
  }

  static async getOverridesForUsers(
    userIds: number[],
    eventType: string
  ): Promise<Map<number, Record<string, boolean>>> {
    if (userIds.length === 0) return new Map();

    const rows = await database('notification_settings')
      .whereIn('userId', userIds)
      .andWhere({ eventType })
      .select('*') as NotificationSettingModel[];

    const map = new Map<number, Record<string, boolean>>();
    for (const row of rows) {
      if (!map.has(row.userId)) {
        map.set(row.userId, {});
      }
      map.get(row.userId)![row.channel] = row.isEnabled;
    }

    return map;
  }

  static async updateSetting(
    userId: number,
    eventType: string,
    channel: string,
    isEnabled: boolean
  ): Promise<NotificationSettingModel> {
    const now = currentDate();
    const [result] = await database('notification_settings')
      .insert({
        createdAt: now,
        updatedAt: now,
        userId,
        eventType,
        channel,
        isEnabled,
      })
      .onConflict(['userId', 'eventType', 'channel'])
      .merge({
        updatedAt: now,
        isEnabled,
      })
      .returning('*');

    return result;
  }

  static getEffectiveSettings(
    eventType: NotificationEventType,
    overrides?: Record<string, boolean>
  ): { pushEnabled: boolean; emailEnabled: boolean } {
    const defaults = NOTIFICATION_DEFAULTS[eventType];
    return {
      pushEnabled: overrides?.PUSH ?? defaults.PUSH ?? false,
      emailEnabled: overrides?.EMAIL ?? defaults.EMAIL ?? false,
    };
  }
}
