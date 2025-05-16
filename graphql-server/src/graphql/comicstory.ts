import { validateAndTrimUuid } from './error.js';
import type { GraphQLContext } from '../middleware/auth.js';

import type { 
  QueryResolvers, 
  ComicStoryResolvers,
} from '@inkverse/shared-server/graphql/types';

import type { ComicIssueModel, ComicSeriesModel, ComicStoryModel } from '@inkverse/shared-server/database/types';
import { ComicStory, ComicIssue, ComicSeries } from '@inkverse/shared-server/models/index';

const ComicStoryDefinitions = `
" Comic Story Details "
type ComicStory {
  
  " Unique identifier for a comic story "
  uuid: ID!

  " Unique identifier for a comic issue this story belongs to "
  issueUuid: ID!

  " Unique identifier for a comic series this story belongs to "
  seriesUuid: ID!
  
  " A different hash means that details for this story have updated since the last hash "
  hash: String

  " Stringified JSON details for the story art. Convert to JSON to use."
  storyImageAsString: String

  " If the story has now been removed from the SSS Feed "
  isRemoved: Boolean
  
  " Details on the comic issue that this story belongs to "
  comicIssue: ComicIssue
  
  " Details on the comic series that this story belongs to "
  comicSeries: ComicSeries

  " Width of the story image "
  width: Int

  " Height of the story image "
  height: Int
}
`

const ComicStoryQueriesDefinitions = `
" Get details on a comic story"
getComicStory(
  " Unique identifier for a comic story "
  uuid: ID
):ComicStory
`

const ComicStoryQueries: QueryResolvers = {
  async getComicStory(root, { uuid }, context: GraphQLContext): Promise<ComicStoryModel | null>{
    if (uuid) {
      const trimmedUuid = validateAndTrimUuid(uuid);
      return await ComicStory.getComicStoryByUuid(trimmedUuid);
    }else{
      return null;
    }
  },
}

const ComicStoryFieldResolvers: ComicStoryResolvers = {
  ComicStory: {
    storyImageAsString({ storyImage }: ComicStoryModel, args: any, context: GraphQLContext): string | null {
      return storyImage && JSON.stringify(storyImage);
    },

    async comicIssue({ issueUuid }: ComicStoryModel, args: any, context: GraphQLContext): Promise<ComicIssueModel | null> {
      const trimmedIssueUuid = validateAndTrimUuid(issueUuid, 'issueUuid');
      return await ComicIssue.getComicIssueByUuid(trimmedIssueUuid);
    },

    async comicSeries({ seriesUuid }: ComicStoryModel, args: any, context: GraphQLContext): Promise<ComicSeriesModel | null> {
      const trimmedSeriesUuid = validateAndTrimUuid(seriesUuid, 'seriesUuid');
      return await ComicSeries.getComicSeriesByUuid(trimmedSeriesUuid);
    },
  }
}

export {
  ComicStoryDefinitions,
  ComicStoryQueriesDefinitions,
  ComicStoryQueries,
  ComicStoryFieldResolvers,
}
