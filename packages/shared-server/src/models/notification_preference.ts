import { database } from '../database/index.js';
import type { NotificationPreferenceModel } from '../database/types.js';
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
}