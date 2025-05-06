import { validateAndTrimUuid } from './error.js';
import type { GraphQLContext } from './utils.js';

import { TaddyType } from '@inkverse/shared-server/graphql/types';
import type { CreatorContentResolvers, QueryResolvers } from '@inkverse/shared-server/graphql/types';
import type { CreatorContentModel } from '@inkverse/shared-server/database/types';

import { CreatorContent, ComicSeries } from '@inkverse/shared-server/models/index';

const CreatorContentDefinitions = `
" CreatorContent Details "
type CreatorContent {
  " Unique identifier for this creatorcontent "
  id: ID @deprecated(reason: "Use uuid instead")

  " Unique identifier for this creatorcontent "
  uuid: ID

  " A hash of all creatorcontent details "
  hash: String

  " Unique identifier for the creator "
  creatorUuid: ID

  " Unique identifier for the content "
  contentUuid: ID

  " Content type "
  contentType: TaddyType

  " Roles for the creator for this content "
  roles: [ContentRole]

  " Position on the creator feed "
  position: Int

  " Position on the content feed "
  contentPosition: Int

  " If content is a comic - Details for the content "
  comicseries: ComicSeries
}
`

const CreatorContentQueriesDefinitions = `
" Get details on a Creator Content "
getCreatorContent(
  " Get creatorcontent by creator identifier "
  creatorUuid: ID,

  " Get creatorcontent by content identifier "
  contentUuid: ID
):CreatorContent
`

const CreatorContentQueries: QueryResolvers<CreatorContentModel> = {
  async getCreatorContent(root, { creatorUuid, contentUuid }, context): Promise<CreatorContentModel | null> {    
    if (creatorUuid && contentUuid){
      const safeCreatorUuid = validateAndTrimUuid(creatorUuid);
      const safeContentUuid = validateAndTrimUuid(contentUuid);
      return await CreatorContent.getCreatorContent(safeCreatorUuid, safeContentUuid);
    }else{
      return null;
    }
  },
}

const CreatorContentFieldResolvers: CreatorContentResolvers<CreatorContentModel> = {
  CreatorContent: {
    comicseries({ contentUuid, contentType }: CreatorContentModel, _: any, context: GraphQLContext) {
      if (contentType !== TaddyType.COMICSERIES) return null
      if (!contentUuid) return null

      return ComicSeries.getComicSeriesByUuid(contentUuid)
    }
  }
}

export {
  CreatorContentDefinitions,
  CreatorContentQueriesDefinitions,
  CreatorContentQueries,
  CreatorContentFieldResolvers,
}