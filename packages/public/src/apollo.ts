export const typePolicies = {
  User: {
    keyFields: ["id"]
  },
  Documentation: {
    keyFields: ["id"]
  },
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
  List: {
    keyFields: ["id"]
  },
  HostingProvider: {
    keyFields: ["uuid"]
  },
  SearchResults: {
    keyFields: ["searchId"]
  },
  SearchQueryResponseInfo: {
    keyFields: ["searchId"]
  },
  SearchQueryResponseInfoDetails: {
    keyFields: ["searchId"]
  },
  BlueskyProfile: {
    keyFields: ["did"]
  },
  UserComicSeries: {
    keyFields: ["seriesUuid"]
  },
}