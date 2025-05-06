import type { Knex } from "knex";
import { database, type UUIDLookupModel } from "../database/index.js";
import { TaddyType } from "../graphql/types.js";

export class UUIDLookup {
  static async getUuidLookup(uuid: string): Promise<UUIDLookupModel | null> {
    return await database("uuid_lookup")
    .where({
      uuid,
    })
    .first('*');
  }

  static async saveUUIDforType(transaction: Knex.Transaction, uuid: string, type: TaddyType): Promise<UUIDLookupModel> {
    const [ uuid_lookup ] = await database("uuid_lookup")
    .transacting(transaction)
    .insert({
      uuid,
      taddy_type: type 
    })
    .returning('*');

    return uuid_lookup
  }

  static async deleteLookupsForUuids(transaction: Knex.Transaction, uuids: string[]): Promise<void> {
    return await database("uuid_lookup")
      .transacting(transaction)
      .whereIn('uuid', uuids)
      .delete();
  }
}