import { database } from "../database/index.js";
import type { UserSeriesSubscriptionModel } from "../database/types.js";
import { currentDate } from "../utils/date.js";

export class UserSeriesSubscription {
  static async subscribeToComicSeries(userId: number, seriesUuid: string): Promise<UserSeriesSubscriptionModel | null> {
    const [subscription] = await database('userseries_subscriptions')
      .insert({
        userId,
        seriesUuid,
        updatedAt: currentDate()
      })
      .onConflict(['userId', 'seriesUuid'])
      .merge()
      .returning('*');
    
    return subscription || null;
  }

  static async unsubscribeFromComicSeries(userId: number, seriesUuid: string): Promise<boolean> {
    const deleted = await database('userseries_subscriptions')
      .where({ userId, seriesUuid })
      .delete();
    
    return deleted > 0;
  }

  static async getSubscription(userId: number, seriesUuid: string): Promise<UserSeriesSubscriptionModel | null> {
    const subscription = await database('userseries_subscriptions')
      .where({ userId, seriesUuid })
      .first('*');
    
    return subscription || null;
  }

  static async getUserSubscriptions(userId: number, limit: number = 1000, offset: number = 0): Promise<UserSeriesSubscriptionModel[]> {
    const subscriptions = await database('userseries_subscriptions')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*');
    
    return subscriptions;
  }

  static async subscribeToMultipleComicSeries(userId: number, seriesUuids: string[]): Promise<boolean> {
    const updatedAt = currentDate();
    const subscriptions = await database('userseries_subscriptions')
      .insert(seriesUuids.map(seriesUuid => ({ userId, seriesUuid, updatedAt })))
      .onConflict(['userId', 'seriesUuid'])
      .merge();

    return subscriptions.length > 0;
  }
}