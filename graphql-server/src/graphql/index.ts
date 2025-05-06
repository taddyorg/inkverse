import { gql } from 'graphql-tag';
import type { Resolvers } from '@inkverse/shared-server/graphql/types';

import { CommonDefinitions } from './common.js';
import { 
  ComicSeriesDefinitions, 
  ComicSeriesQueriesDefinitions, 
  ComicSeriesQueries, 
  ComicSeriesFieldResolvers,
  ComicSeriesMutationsDefinitions,
  ComicSeriesMutations,
} from './comicseries.js';

import { 
  ComicIssueDefinitions, 
  ComicIssueQueriesDefinitions, 
  ComicIssueQueries, 
  ComicIssueFieldResolvers 
} from './comicissue.js';

import { 
  ComicStoryDefinitions, 
  ComicStoryQueriesDefinitions, 
  ComicStoryQueries, 
  ComicStoryFieldResolvers 
} from './comicstory.js';

import { 
  CreatorDefinitions, 
  LinkDefinitions,
  CreatorLinkDefintions,
  CreatorQueriesDefinitions, 
  CreatorQueries, 
  CreatorFieldResolvers 
} from './creator.js';

import { 
  CreatorContentDefinitions, 
  CreatorContentQueriesDefinitions, 
  CreatorContentQueries, 
  CreatorContentFieldResolvers 
} from './creatorcontent.js';

import {
  DocsDefinitions,
  DocsQueriesDefinitions,
  DocsQueries,
} from './docs.js';

import {
  HomeScreenDefinitions,
  HomeScreenQueriesDefinitions,
  HomeScreenQueries,
} from './home.js';

import {
  ListDefinitions,
  ListQueriesDefinitions,
  ListQueries,
} from './list.js';

import {
  SearchDefinitions,
  SearchQueriesDefinitions,
  SearchQueries,
  SearchResolvers
} from './search.js';

export const typeDefs = gql`#graphql
  ${CommonDefinitions}
  ${ComicSeriesDefinitions}
  ${ComicIssueDefinitions}
  ${ComicStoryDefinitions}
  ${CreatorDefinitions}
  ${LinkDefinitions}
  ${CreatorLinkDefintions}
  ${CreatorContentDefinitions}
  ${DocsDefinitions}
  ${HomeScreenDefinitions}
  ${ListDefinitions}
  ${SearchDefinitions}

  type Query {
    ${ComicSeriesQueriesDefinitions}
    ${ComicIssueQueriesDefinitions}
    ${ComicStoryQueriesDefinitions}
    ${CreatorQueriesDefinitions}
    ${CreatorContentQueriesDefinitions}
    ${DocsQueriesDefinitions}
    ${HomeScreenQueriesDefinitions}
    ${ListQueriesDefinitions}
    ${SearchQueriesDefinitions}
  }

  type Mutation {
    ${ComicSeriesMutationsDefinitions}
  }
`;

// Resolvers define the technique for fetching types
export const resolvers: Resolvers = {
  Query: {
    ...ComicSeriesQueries,
    ...ComicIssueQueries,
    ...ComicStoryQueries,
    ...CreatorQueries,
    ...CreatorContentQueries,
    ...DocsQueries,
    ...HomeScreenQueries,
    ...ListQueries,
    ...SearchQueries,
  },
  Mutation: {
    ...ComicSeriesMutations,
  },
  ...ComicSeriesFieldResolvers,
  ...ComicIssueFieldResolvers,
  ...ComicStoryFieldResolvers,
  ...CreatorFieldResolvers,
  ...CreatorContentFieldResolvers,
  ...SearchResolvers,
};
