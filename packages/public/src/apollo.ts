export const typePolicies = {
  ComicSeries: {
    keyFields: ["uuid"],
  },
  ComicIssue: {
    keyFields: ["uuid"]
  },
  ComicIssueForSeries: {
    keyFields: ["seriesUuid"]
  },
  ComicStory: {
    keyFields: ["uuid"]
  },
  Creator: {
    keyFields: ["uuid"]
  },
  CreatorContent: {
    keyFields: ["uuid"]
  },
  CreatorLinkDetails: {
    keyFields: ["creatorUuid", "url"]
  },
  HomeScreenComicSeries: {
    keyFields: ["id"]
  },
  HomeScreenCuratedList: {
    keyFields: ["id"]
  },
  Documentation: {
    keyFields: ["id"]
  },
  SearchResults: {
    keyFields: ["searchId"]
  },
  List: {
    keyFields: ["id"]
  },
  User: {
    keyFields: ["id"]
  },
}

export const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};