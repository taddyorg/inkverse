import type { GraphQLContext } from '../middleware/auth.js';
import { curatedListsData } from '@inkverse/shared-server/utils/hardcoded';
import { ListType, type ListModel } from '@inkverse/shared-server/database/types';

import type { 
  QueryResolvers, 
  QueryGetListArgs,
} from '@inkverse/shared-server/graphql/types';

import { ComicSeries } from '@inkverse/shared-server/models/index';

const ListDefinitions = `
" List Details "
type List {
  " Unique identifier for this list "
  id: ID!

  " The date this list was created "
  createdAt: Int

  " The name (title) for a list "
  name: String

  " The description for a list "
  description: String

  " The url for the banner image "
  bannerImageUrl: String

  " The type of this list "
  type: ListType!

  " A boolean indicating whether this list is private "
  privacyType: PrivacyType!

  " The user id of the user who created this list "
  userId: ID!

  " Comic series items in this list "
  comicSeries: [ComicSeries]

  " Tags for the comic series "
  tags: [String]

  " Genres for the comic series "
  genres: [Genre]

  " The language the comic series is in "
  language: Language

  " Rating of the comic series "
  contentRating: ContentRating
}

" The type of list "
enum ListType {
  " A list of comic series "
  COMICSERIES

  " A list of comic issues "
  COMICISSUES

  " A list of creators "
  CREATORS
}

" The privacy types for a list "
enum PrivacyType {
  " The list is public "
  PUBLIC

  " The list is private "
  PRIVATE
}
`

const ListQueriesDefinitions = `
  " Get details on a List "
  getList(
    " Get a list by its unique identifier (uuid) "
    id: ID!
  ):List
`

const ListQueries: QueryResolvers = {
  async getList(root: any, { id }: QueryGetListArgs, context: GraphQLContext): Promise<ListModel | null> {    
    const list = curatedListsData[id];
    if (!list || list.type !== ListType.COMICSERIES) { return null; }

    const comicSeries = await ComicSeries.getComicSeriesByUuids(list.uuids);
    
    return {
      ...list,
      comicSeries
    }
  },
};

export {
  ListDefinitions,
  ListQueriesDefinitions,
  ListQueries,
}