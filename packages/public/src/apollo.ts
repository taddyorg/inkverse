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
  SearchResults: {
    keyFields: ["searchId"]
  },
  BlueskyProfile: {
    keyFields: ["did"]
  },
  UserComicSeries: {
    keyFields: ["seriesUuid"]
  },
  CannySSO: {
    keyFields: ["userId"]
  },
}