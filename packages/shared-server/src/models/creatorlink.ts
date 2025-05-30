import type { LinkType } from "@inkverse/public/graphql/types";
import { database, type CreatorLinkModel } from "../database/index.js";
import { safeStringValue } from "../utils/common.js";
import { safeLinkType } from "@inkverse/public/links";
import type { Knex } from "knex";

type CreatorLinkInput = Omit<CreatorLinkModel, 'id' | 'createdAt' | 'updatedAt'>;

function getCreatorLinkDetails(data: Record<string, any>, creatorUuid: string): CreatorLinkInput {
  console.log('getCreatorLinkDetails', data, creatorUuid);
  const type = safeLinkType(data.type);
  const baseUrl = safeStringValue(data.base_url);
  const value = safeStringValue(data.value);

  if (!creatorUuid) {
    throw new Error('getCreatorLinkDetails - creatorUuid is required');
  }
  if (!type) {
    throw new Error('getCreatorLinkDetails - valid type is required');
  }
  if (!value) {
    throw new Error('getCreatorLinkDetails - value is required');
  }

  return {
    creatorUuid,
    type,
    baseUrl,
    value,
  };
}

export class CreatorLink {
  static async getCreatorLinks(creatorUuid: string): Promise<CreatorLinkModel[]> {
    return await database('creatorlink')
      .where({ creatorUuid })
      .orderBy('type', 'asc')
      .returning('*');
  }

  static async getCreatorLinksByType(creatorUuid: string, type: LinkType): Promise<CreatorLinkModel[]> {
    return await database('creatorlink')
      .where({ creatorUuid, type })
      .returning('*');
  }

  static async addCreatorLinks(links: Record<string, any>[] | null, creatorUuid: string, trx: Knex.Transaction): Promise<CreatorLinkModel[]> {
    if (!links || links.length === 0) {
      return [];
    }

    const linksToInsert = links.map(link => getCreatorLinkDetails(link, creatorUuid));
    
    return await database('creatorlink')
      .transacting(trx)
      .insert(linksToInsert)
      .returning('*');
  }

  static async updateCreatorLinks(links: Record<string, any>[] | null, creatorUuid: string, trx: Knex.Transaction): Promise<CreatorLinkModel[]> {
    if (!links || links.length === 0) {
      return [];
    }
    
    try {
      // Delete existing links
      await CreatorLink.deleteCreatorLinks(creatorUuid, trx);
      
      // Add new links
      return await CreatorLink.addCreatorLinks(links, creatorUuid, trx);
    } catch (e) {
      console.log('updateCreatorLinks transaction rollback', creatorUuid, e);
      throw e;
    }
  }

  static async deleteCreatorLinks(creatorUuid: string, trx: Knex.Transaction): Promise<CreatorLinkModel[]> {
    return await database('creatorlink')
      .transacting(trx)
      .where({ creatorUuid })
      .delete('*');
  }
}