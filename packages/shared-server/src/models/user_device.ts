/**
 * UserDevice model for push notification tokens
 */

import { Expo } from "expo-server-sdk";
import { database } from "../database/index.js";
import type { UserDeviceModel } from '@inkverse/shared-server/database/types';

export class UserDevice {
  /**
   * Store or update a push token for a user device
   */
  static async savePushToken(
    userId: string,
    fcmToken: string,
    platform: string
  ): Promise<void> {
    if (!Expo.isExpoPushToken(fcmToken)) {
      throw new Error(`Invalid Expo push token: ${fcmToken}`);
    }

    await database('user_device')
      .insert({
        userId,
        fcmToken,
        platform,
      })
      .onConflict(['userId', 'fcmToken'])
      .merge({
        updatedAt: new Date(),
        platform,
      });
  }

  /**
   * Remove a push token (delete record)
   */
  static async removePushToken(userId: string, fcmToken: string): Promise<void> {
    await database('user_device')
      .where({ userId, fcmToken })
      .delete();
  }

  /**
   * Get active push tokens for a user
   */
  static async getPushTokensForUser(userId: string): Promise<UserDeviceModel[]> {
    return await database('user_device')
      .where({ userId })
      .select('*');
  }

  /**
   * Get user device by ID
   */
  static async getUserDeviceById(id: number): Promise<UserDeviceModel | null> {
    return await database('user_device')
      .where({ id })
      .first('*');
  }

  /**
   * Delete all devices for a user
   */
  static async deleteUserDevicesForUser(userId: string): Promise<void> {
    await database('user_device')
      .where({ userId })
      .delete();
  }
}