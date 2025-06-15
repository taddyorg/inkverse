import { database } from "../database/index.js";
import { TaddyType } from "../graphql/types.js";
import { convertToCamelCase } from "../utils/common.js";

export class Common {
  static async getUuidDetails(taddyType: TaddyType, uuid: string){
    return await database(taddyType)
      .where({ uuid })
      .first();
  }
}