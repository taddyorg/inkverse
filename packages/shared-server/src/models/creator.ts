import { get } from "lodash-es";

import { database, type CreatorModel } from "../database/index.js";
import { TaddyType } from "../graphql/types.js";

import { safeCountry } from "@inkverse/public/country";
import { safeLinkType } from "@inkverse/public/links";

import { safeStringValue, safeArrayProperties, safeObjWithVariantKeys, convertTextToBoolean, prettyEncodeTitle } from "../utils/common.js";
import { UUIDLookup } from "./index.js";

type CreatorInput = Omit<CreatorModel, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;

function getCreatorDetails(data: Record<string, any>, shortUrl: string): CreatorInput {
  const name = safeStringValue(get(data, 'name', null));
  const bio = safeStringValue(get(data, 'bio', null), 1000);
  const hash = safeStringValue(get(data, 'hash', null), 255);
  const contentHash = safeStringValue(get(data, 'contentHash', null), 255);
  const datePublished = get(data, 'datePublished', null);
  const avatarImageAsString = safeStringValue(get(data, 'avatarImageAsString', null), 5000);
  const avatarImage = safeObjWithVariantKeys(avatarImageAsString, ['base_url', 'avatar_sm', 'avatar_md', 'avatar_lg']);
  const country = safeCountry(get(data, 'country', null));
  const tags = safeArrayProperties(get(data, 'tags', null), 255);
  const linksAsString = safeStringValue(get(data, 'linksAsString', null), 5000);
  const links = linksAsString 
    ? (JSON.parse(linksAsString) || []).filter((link: Record<string, string>) => safeLinkType(link.type)) 
    : null;
  const copyright = safeStringValue(get(data, 'copyright', null), 2000);
  const sssUrl = safeStringValue(get(data, 'sssUrl', null), 2000);
  const sssOwnerName = safeStringValue(get(data, 'sssOwnerName', null));
  const sssOwnerPublicEmail = safeStringValue(get(data, 'sssOwnerPublicEmail', null), 1000);
  const isBlocked = convertTextToBoolean(get(data, 'isBlocked', null));

  return {
    name,
    bio,
    shortUrl,
    hash,
    contentHash,
    datePublished,
    avatarImage,
    country,
    tags,
    links,
    copyright,
    sssUrl,
    sssOwnerName,
    sssOwnerPublicEmail,
    isBlocked,
  }
}

export class Creator {
  static async getCreatorByUuid(uuid: string): Promise<CreatorModel | null> {
    return await database('creator')
      .where({ uuid })
      .first();
  }

  static async getCreatorByShortUrl(shortUrl: string): Promise<CreatorModel | null> {
    return await database('creator')
      .where({ shortUrl })
      .first();
  }

  static async getShortUrl(uuid: string, name: string): Promise<string> {
    const savedcreator = await Creator.getCreatorByUuid(uuid);
    if (savedcreator && savedcreator.shortUrl) {
      return savedcreator.shortUrl
    }else{
      if (!name) { throw new Error('creator - getShortUrl - name is required')};
      const nameLowercase = name.toLowerCase();
      const shortUrl = prettyEncodeTitle(nameLowercase);
      const formattedShortUrl = `^${shortUrl}($|[0-9]+)`
      const creators = await database('creator')
        .whereRaw("short_url ~ ? AND (short_url !~ '[0-9]$' OR short_url ~ '[0-9]+$')", [formattedShortUrl])
        .returning("*");
      return creators.length > 0 
        ? `${shortUrl}-${creators.length}` 
        : shortUrl;
    }
  }

  static async addCreator(data: Record<string, any>): Promise<CreatorModel | null> {    
    const { uuid, name } = data;
    var trx = await database.transaction();
    try {
      const shortUrl = await Creator.getShortUrl(uuid, name);
      await UUIDLookup.saveUUIDforType(trx, uuid, TaddyType.CREATOR);
      const [ creator ] = await database("creator")
        .transacting(trx)
        .insert({
          uuid,
          ...getCreatorDetails(data, shortUrl)
        })
        .returning("*");
      
      await trx.commit();
      
      return creator;
    }
    catch (e) {
      console.log('addCreator transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async updateCreator(data: Record<string, any>): Promise<CreatorModel | null> {    
    const { uuid, name } = data;
    var trx = await database.transaction();
    try {
      const shortUrl = await Creator.getShortUrl(uuid, name);
      const [ creator ] = await database("creator")
        .transacting(trx)
        .where({ uuid })
        .update({
          updatedAt: new Date(),
          ...getCreatorDetails(data, shortUrl)
        })
        .returning("*");
      
      await trx.commit();
      
      return creator;
    }
    catch (e) {
      console.log('updateCreator transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async deleteCreator(data: Record<string, any>): Promise<{ uuid: string, contentUuids: string[], shortUrl: string } | null> {
    const { uuid } = data;
    var trx = await database.transaction();

    try {      
      const [ deletedCreator ] = await database('creator')
        .transacting(trx)
        .where({ uuid })
        .delete('*');

      const deletedCreatorContent = await database('creatorcontent')
        .transacting(trx)
        .where({ creatorUuid: uuid })
        .delete('*');

      const allContentUUids = deletedCreatorContent.map(creatorcontent => creatorcontent.uuid);
      const allUuids = [ uuid, ...allContentUUids ];

      await UUIDLookup.deleteLookupsForUuids(trx, allUuids);

      await trx.commit();
      
      return {
        uuid,
        contentUuids: allContentUUids,
        shortUrl: deletedCreator.shortUrl
      };
    }
    catch (e) {
      console.log('deleteCreator transaction rollback', uuid, e);
      await trx.rollback();
      throw e;
    }
  }

  static async getCreatorsForContent(contentUuid: string, contentType: TaddyType): Promise<CreatorModel[]> {
    return await database.select([
      'creator.*',
    ])
    .from('creator').leftJoin('creatorcontent', 'creator.uuid', 'creatorcontent.creator_uuid')
    .whereRaw('creatorcontent.content_uuid = ? AND creatorcontent.content_type = ?', [contentUuid, contentType])
    .orderByRaw('creatorcontent.content_position asc NULLS LAST')
    .returning('*');
  }
}

