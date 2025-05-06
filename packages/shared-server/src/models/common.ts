import { database } from "../database/index.js";
import { TaddyType } from "../graphql/types.js";

export class Common {
  static async getUuidDetails(taddyType: TaddyType, uuid: string){
    return await database(taddyType)
      .where({ uuid })
      .first();
  }

  static async getFCMTokensForEvent(event: string, data: Record<string, any>){
  //   switch (event) {
  //     case 'webhook-comicissue-created': {
  //       if (!data.seriesUuid) {
  //         throw new Error(`Missing data.seriesUuid - getFCMTokensForEvent()`)
  //       }

  //       const userRows = await database.raw(`
  //         SELECT fcm_token FROM user_device AS UD
  //           JOIN userseries_subscription AS USS
  //           ON USS.user_id = UD.user_id
  //           WHERE USS.series_uuid = ?;
  //       `, [data.seriesUuid]);

  //       return userRows.rows && userRows.rows.map(item => convertToCamelCase(item));
  //     }

  //     case 'webhook-creatorcontent-created': {
  //       if (!data.contentUuid) {
  //         throw new Error(`Missing data.contentUuid - getFCMTokensForEvent()`)
  //       }

  //       const userRows = await database.raw(`
  //       SELECT fcm_token FROM user_device AS UD
  //         JOIN userseries_subscription AS USS
  //         ON USS.user_id = UD.user_id
  //         WHERE USS.series_uuid = ?;
  //       `, [data.contentUuid]);

  //       return userRows.rows && userRows.rows.map(item => convertToCamelCase(item));
  //     }

  //     default:
  //       throw new Error(`getFCMTokensForEvent - Invalid event: ${event}`);
  //   }
  }
}