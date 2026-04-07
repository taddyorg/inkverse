import { database } from '../database/index.js';
import type { UserNotificationModel } from '../database/types.js';
import { NotificationEventType } from '../graphql/types.js';
import { AGGREGATED_EVENT_TYPES } from './notification_setting.js';
import { currentDate } from '../utils/date.js';
import moment from 'moment';

export type AggregatedNotificationRow = {
  eventType: NotificationEventType;
  targetUuid: string;
  targetType: string;
  parentUuid: string | null;
  parentType: string | null;
  latestCreatedAt: number;
  count: number;
};

export enum NotificationTimeBucket {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  EARLIER = 'EARLIER',
}

export function getBucketBoundaries(bucket: NotificationTimeBucket): { start: number; end: number } {
  const now = currentDate();
  const startOfToday = moment.utc().startOf('day').unix();
  const startOfWeek = moment.utc().startOf('isoWeek').unix();
  const startOfMonth = moment.utc().startOf('month').unix();

  switch (bucket) {
    case NotificationTimeBucket.TODAY:
      return { start: startOfToday, end: now };
    case NotificationTimeBucket.THIS_WEEK:
      return { start: startOfWeek, end: startOfToday };
    case NotificationTimeBucket.THIS_MONTH:
      return { start: startOfMonth, end: startOfWeek };
    case NotificationTimeBucket.EARLIER:
      return { start: 0, end: startOfMonth };
  }
}

export class UserNotification {
  static async createNotification(params: {
    recipientId: number;
    senderId: number | null;
    eventType: string;
    targetUuid: string;
    targetType: string;
    parentUuid?: string | null;
    parentType?: string | null;
  }): Promise<UserNotificationModel> {
    const [notification] = await database('user_notifications')
      .insert({
        createdAt: currentDate(),
        recipientId: params.recipientId,
        senderId: params.senderId,
        eventType: params.eventType,
        targetUuid: params.targetUuid,
        targetType: params.targetType,
        parentUuid: params.parentUuid || null,
        parentType: params.parentType || null,
      })
      .returning('*');

    return notification;
  }

  static async createBatchNotifications(params: {
    recipientId: number;
    senderId: number | null;
    eventType: string;
    targetUuid: string;
    targetType: string;
    parentUuid?: string | null;
    parentType?: string | null;
  }[]): Promise<void> {
    if (params.length === 0) return;

    const now = currentDate();
    const rows = params.map((p) => ({
      createdAt: now,
      recipientId: p.recipientId,
      senderId: p.senderId,
      eventType: p.eventType,
      targetUuid: p.targetUuid,
      targetType: p.targetType,
      parentUuid: p.parentUuid || null,
      parentType: p.parentType || null,
    }));

    await database('user_notifications').insert(rows);
  }

  static async getNotificationsForUser(
    recipientId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserNotificationModel[]> {
    return await database('user_notifications')
      .where({ recipientId })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*');
  }

  static async getNotificationsInWindow(
    eventTypes: string[],
    windowStart: number,
    windowEnd: number,
    limit: number = 1000,
    offset: number = 0
  ): Promise<UserNotificationModel[]> {
    return await database('user_notifications')
      .whereIn('eventType', eventTypes)
      .andWhere('createdAt', '>=', windowStart)
      .andWhere('createdAt', '<', windowEnd)
      .orderBy('recipientId', 'asc')
      .limit(limit)
      .offset(offset)
      .select('*');
  }

  static async deleteOldNotifications(olderThanEpoch: number, batchSize: number = 10000): Promise<number> {
    const maxIdRow = await database('user_notifications')
      .where('createdAt', '<', olderThanEpoch)
      .andWhere('eventType', NotificationEventType.NEW_EPISODE_RELEASED)
      .max('id as maxId')
      .first();

    const maxId = maxIdRow?.maxId;
    if (!maxId) return 0;

    const deleteBatch = async (total: number): Promise<number> => {
      const deleted = await database('user_notifications')
        .where('id', '<=', maxId)
        .andWhere('createdAt', '<', olderThanEpoch)
        .limit(batchSize)
        .delete();

      if (deleted === 0) return total;
      return deleteBatch(total + deleted);
    };

    return deleteBatch(0);
  }

  static async getAggregatedNotificationsForBucket(
    recipientId: number,
    startEpoch: number,
    endEpoch: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<AggregatedNotificationRow[]> {
    const eventTypes = Array.from(AGGREGATED_EVENT_TYPES);
    const placeholders = eventTypes.map(() => '?').join(', ');
    const result = await database.raw(`
      SELECT
        event_type AS "eventType",
        target_uuid AS "targetUuid",
        target_type AS "targetType",
        parent_uuid AS "parentUuid",
        parent_type AS "parentType",
        MAX(created_at) AS "latestCreatedAt",
        COUNT(*)::int AS count
      FROM user_notifications
      WHERE recipient_id = ?
        AND event_type IN (${placeholders})
        AND created_at >= ?
        AND created_at < ?
      GROUP BY event_type, target_uuid, target_type, parent_uuid, parent_type
      ORDER BY "latestCreatedAt" DESC
      LIMIT ?
      OFFSET ?
    `, [recipientId, ...eventTypes, startEpoch, endEpoch, limit, offset]);

    return result.rows;
  }

  static async getIndividualNotificationsForBucket(
    recipientId: number,
    startEpoch: number,
    endEpoch: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserNotificationModel[]> {
    const individualEventTypes = Object.values(NotificationEventType).filter(t => !AGGREGATED_EVENT_TYPES.has(t));
    return await database('user_notifications')
      .where({ recipientId })
      .whereIn('eventType', individualEventTypes)
      .andWhere('createdAt', '>=', startEpoch)
      .andWhere('createdAt', '<', endEpoch)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*');
  }
}
