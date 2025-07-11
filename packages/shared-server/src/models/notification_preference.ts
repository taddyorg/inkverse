import { database } from '../database/index.js';
import type { NotificationPreferenceModel, UserDeviceModel } from '../database/types.js';
import { NotificationType } from '../graphql/types.js';

export class NotificationPreference {
  /**
   * Enable a notification preference
   */
  static async enableNotification(
    userId: number,
    notificationType: NotificationType,
    value: string
  ): Promise<NotificationPreferenceModel> {
    const [result] = await database('notification_preferences')
      .insert({
        userId,
        notificationType,
        value,
      })
      .onConflict(['userId', 'notificationType', 'value'])
      .merge()
      .returning('*');
    
    return result;
  }

  /**
   * Disable a notification preference
   */
  static async disableNotification(
    userId: number,
    notificationType: NotificationType,
    value: string
  ): Promise<void> {
    await database('notification_preferences')
      .where({
        userId,
        notificationType,
        value,
      })
      .delete();
  }

  /**
   * Check if user has a notification preference enabled
   */
  static async hasNotificationEnabled(
    userId: number,
    notificationType: NotificationType,
    value: string
  ): Promise<boolean> {
    const preference = await database('notification_preferences')
      .where({
        userId,
        notificationType,
        value,
      })
      .first();
    
    return !!preference;
  }

  /**
   * Get devices for users who have notifications enabled for a series
   */
  static async getDevicesForSeriesNotifications(
    seriesUuid: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<UserDeviceModel[]> {
    const devices = await database('notification_preferences as np')
      .join('user_device as ud', 'np.user_id', 'ud.user_id')
      .where({
        'np.notification_type': NotificationType.NEW_EPISODE_RELEASED,
        'np.value': seriesUuid
      })
      .orderBy('np.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('ud.*');
    
    return devices;
  }

  /**
   * Get count of users with notifications enabled for a series
   */
  static async getNotificationEnabledCount(
    seriesUuid: string
  ): Promise<number> {
    const result = await database('notification_preferences as np')
      .join('user_device as ud', 'np.user_id', 'ud.user_id')
      .where({
        'np.notification_type': NotificationType.NEW_EPISODE_RELEASED,
        'np.value': seriesUuid
      })
      .count('np.user_id as count')
      .first();
    
    return parseInt(result?.count?.toString() || '0', 10);
  }
}