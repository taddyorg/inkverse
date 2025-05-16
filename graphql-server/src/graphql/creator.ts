import { isNumber } from 'lodash-es';

import { validateAndTrimUuid, UserInputError } from './error.js';
import type { GraphQLContext } from '../middleware/auth.js';

import type { 
  QueryResolvers,
  CreatorContentArgs,
  CreatorResolvers,
  CreatorLinkDetails,
  LinkDetails,
} from '@inkverse/shared-server/graphql/types';
import { LinkType, SortOrder, TaddyType } from '@inkverse/shared-server/graphql/types';

import type { ComicSeriesModel, CreatorContentModel, CreatorModel } from '@inkverse/shared-server/database/types';
import { ComicSeries, Creator, CreatorContent } from '@inkverse/shared-server/models/index';
import { getBaseLinkForSchema } from '@inkverse/public/links';
import { arrayToObject } from '@inkverse/public/utils';
import { safeLinkType } from '@inkverse/public/links';

const CreatorDefinitions = `
  " Creator Details "
  type Creator {
  " Unique identifier for this creator "
  uuid: ID!

  " Date when the creator feed was published (Epoch time in seconds) "
  datePublished: Int

  " The name of the creator "
  name: String

  " A short bio on the creator "
  bio: String

  " The unqiue url ending for a comic "
  shortUrl: String

  " Stringified JSON details for the avatar image. Convert to JSON to use."
  avatarImageAsString: String

  " A hash of all creator details. It may be useful for you to save this property in your database and compare it to know if any details have updated since the last time you checked "
  hash: String

  " A hash of the details for all different content a creator makes. It may be useful for you to save this property in your database and compare it to know if there are any new or updated content since the last time you checked "
  contentHash: String

  " A list of content for this creator "
  content(
    " Sort order for the results. Default is LATEST (newest first), another option is OLDEST (oldest first) "
    sortOrder: SortOrder,

    " (Optional) Taddy paginates the results returned. Default is 1, Max value allowed is 1000 "
    page: Int,

    " (Optional) Return up to this number of results. Default is 10, Max value allowed is 25 results per page "
    limitPerPage: Int
  ): [CreatorContent]

  " Comics for the creator "
  comics: [ComicSeries]

  " Tags for the creator "
  tags: [String]

  " Links to creator's website, email, or social media "
  links: [LinkDetails]

  " The country in which the creator is resides in or is from "
  country: Country

  " Url for the creator's SSS feed "
  sssUrl: String

  " Name to use for contacting the owner of this feed "
  sssOwnerName: String

  " Email to use for contacting the owner of this feed "
  sssOwnerPublicEmail: String

  " Copyright details for this feed "
  copyright: String

  " If the content has violated Taddy's distribution policies for illegal or harmful content it will be blocked from getting any updates "
  isBlocked: Boolean
}
`

const CreatorQueriesDefinitions = `
" Get details on a Creator "
getCreator(
  " Get a creator by its unique identifier (uuid) "
  uuid: ID,

  " Get a comic by its shortUrl "
  shortUrl: String
):Creator

" Get efficient links for creators of content "
getCreatorLinksForSeries(
  " The uuid of the series "
  seriesUuid: ID!
):[CreatorLinkDetails]
`

const LinkDefinitions = `
" Link Details "
type LinkDetails {
  " The type of link "
  type: LinkType

  " The url for the link "
  url: String
}

enum LinkType {
  INSTAGRAM
  YOUTUBE
  TIKTOK
  PATREON
  EMAIL
  TWITTER
  MASTODON
  FACEBOOK
  WEBSITE
  MERCH_STORE
  TWITCH
  SNAPCHAT
  REDDIT
  DISCORD
  TELEGRAM
  PINTEREST
  TUMBLR
  SPOTIFY
  SOUNDCLOUD
  BANDCAMP
  VIMEO
  WECHAT
  WHATSAPP
  KO_FI
  ETSY
  LINKTREE
}
`

const CreatorLinkDefintions = `
" Link Details "
type CreatorLinkDetails {
  " The type of link "
  type: LinkType

  " The url for the link "
  url: String

  " The uuid of the creator "
  creatorUuid: ID!
}
`

const CreatorQueries: QueryResolvers = {
  async getCreator(root: any, { uuid, shortUrl }, context: GraphQLContext): Promise<CreatorModel | null> {
    if (uuid){
      const trimmedUuid = validateAndTrimUuid(uuid)
      return await Creator.getCreatorByUuid(trimmedUuid)
    }else if (shortUrl){
      return await Creator.getCreatorByShortUrl(shortUrl);
    }else{
      return null;
    }
  },

  async getCreatorLinksForSeries(root: any, { seriesUuid }, context: GraphQLContext): Promise<CreatorLinkDetails[]> {
    const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid);
    const creators = await Creator.getCreatorsForContent(trimmedSeriesUuid, TaddyType.COMICSERIES)
    const creatorsByUuid = arrayToObject(creators, "uuid");
    const allCreatorLinks = [];
    for (const creator in creatorsByUuid) {
      const cc = creatorsByUuid[creator];
      if (!cc || !cc.links || !cc.links.length) continue;
      for (const link of cc.links) {
        allCreatorLinks.push({
          creatorUuid: creator,
          type: link.type as LinkType,
          url: link.base_url 
            ? link.type === LinkType.MASTODON
              ? link.base_url + link.value
              : getBaseLinkForSchema(link.type as LinkType, link.value) + link.value
            : link.value, 
        })
      }
    }
    return allCreatorLinks as CreatorLinkDetails[];
  }
}

const CreatorFieldResolvers: CreatorResolvers = {
  Creator: {
    avatarImageAsString({ avatarImage }: CreatorModel, _: any, context: GraphQLContext): string | null {
      return avatarImage && JSON.stringify(avatarImage);
    },

    sssUrl({ sssUrl, isBlocked }: CreatorModel, _: any, context: GraphQLContext): string | null {
      return isBlocked ? null : sssUrl;
    },

    links({ links }: CreatorModel, _: any, context: GraphQLContext): LinkDetails[] {
      if (!links || !links.length) return []

      const safeLinks = links.filter(link => safeLinkType(link.type));

      return safeLinks.map(link => {
        return {
          type: link.type as LinkType,
          url: link.base_url 
            ? link.type === LinkType.MASTODON
              ? link.base_url + link.value
              : getBaseLinkForSchema(link.type as LinkType, link.value) + link.value
            : link.value
        }
      }) as LinkDetails[];
    },

    async content({ uuid }: CreatorModel, args: CreatorContentArgs, context: GraphQLContext): Promise<CreatorContentModel[]> {
      const { sortOrder, page = 1, limitPerPage = 10 } = args;
      if (!isNumber(page) || page < 1 || page > 1000) { throw new UserInputError('page must be between 1 and 1000') }
      if (!isNumber(limitPerPage) || limitPerPage < 1 || limitPerPage > 25) { throw new UserInputError('limitPerPage must be between 1 and 25') }

      const trimmedUuid = validateAndTrimUuid(uuid);
      const offset = (page - 1)*limitPerPage;
      const safeSortOrder = sortOrder ?? SortOrder.LATEST;

      return await CreatorContent.getContentForCreator(
        trimmedUuid, 
        safeSortOrder,
        offset,
        limitPerPage 
      )
    },

    async comics({ uuid }: CreatorModel, _: any, context: GraphQLContext): Promise<ComicSeriesModel[]> {
      const trimmedUuid = validateAndTrimUuid(uuid);
      const content = await CreatorContent.getContentForCreatorAndType(trimmedUuid, TaddyType.COMICSERIES)
      const comicSeriesUuids = content.map(c => c.contentUuid)
      const comicsOutOfOrder = await ComicSeries.getComicSeriesByUuids(comicSeriesUuids)
      const comicsObj = arrayToObject(comicsOutOfOrder, "uuid");
      return comicSeriesUuids.map(uuid => comicsObj[uuid]).filter(c => c !== undefined)
    }
  }
}

export {
  CreatorDefinitions,
  LinkDefinitions,
  CreatorLinkDefintions,
  CreatorQueriesDefinitions,
  CreatorQueries,
  CreatorFieldResolvers,
}