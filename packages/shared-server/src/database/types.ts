import type { 
  ComicSeriesLayoutType, 
  ComicSeriesType, 
  ContentRating, 
  Genre, 
  Language, 
  LinkType, 
  SeriesStatus,
  TaddyType,
  UserAgeRange,
  NotificationType,
} from "../graphql/types.js";

export type ComicSeriesModel = {
  id: number | null;
  uuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  sssUrl: string;
  sssOwnerName: string | null;
  sssOwnerPublicEmail: string | null;
  hash: string | null;
  issuesHash: string | null;
  datePublished: number | null;
  name: string | null;
  description: string | null;
  coverImage: Record<string, string> | null;
  bannerImage: Record<string, string> | null;
  thumbnailImage: Record<string, string> | null;
  seriesType: ComicSeriesType | null;
  language: Language | null;
  contentRating: ContentRating | null;
  genre0: Genre | null;
  genre1: Genre | null;
  genre2: Genre | null;
  tags: string[] | null;
  shortUrl: string;
  copyright: string | null;
  isBlocked: boolean | null;
  status: SeriesStatus | null;
  seriesLayout: ComicSeriesLayoutType | null;
  hostingProviderUuid: string | null;
  scopesForExclusiveContent: string[] | null;
}

export type ComicIssueModel = {
  id: number | null;
  uuid: string;
  seriesUuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  hash: string | null;
  storiesHash: string | null;
  datePublished: number | null;
  name: string | null;
  creatorNote: string | null;
  bannerImage: Record<string, string> | null;
  thumbnailImage: Record<string, string> | null;
  isRemoved: boolean | null;
  isBlocked: boolean | null;
  position: number | null;
  pushNotificationMessage: string | null;
  scopesForExclusiveContent: string[] | null;
  dateExclusiveContentIsAvailable: number | null;
}

export type ComicStoryModel = {
  id: number | null;
  uuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  hash: string | null;
  seriesUuid: string;
  issueUuid: string;
  position: number | null;
  width: number | null;
  height: number | null;
  storyImage: Record<string, string> | null;
  isRemoved: boolean | null;
}

export type CreatorModel = {
  id: number | null;
  uuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  hash: string | null;
  name: string | null;
  bio: string | null;
  avatarImage: Record<string, string> | null;
  contentHash: string | null;
  linksHash: string | null;
  datePublished: number | null;
  country: string | null;
  links: Record<string, string>[] | null;
  tags: string[] | null;
  shortUrl: string;
  copyright: string | null;
  sssUrl: string | null;
  sssOwnerName: string | null;
  sssOwnerPublicEmail: string | null;
  isBlocked: boolean | null;
}

export type CreatorLinkModel = {
  id: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  creatorUuid: string;
  type: LinkType;
  baseUrl: string | null;
  value: string;
}

export type CreatorContentModel = {
  id: number | null;
  uuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  hash: string | null;
  contentUuid: string;
  contentType: TaddyType;
  creatorUuid: string;
  roles: string[] | null;
  position: number | null;
  contentPosition: number | null;
}

export type UUIDLookupModel = {
  id: number;
  uuid: string;
  taddyType: TaddyType;
  createdAt: Date;
  updatedAt: Date | null;
}

// replace with GraphQL enum when ready
export enum ListType {
  COMICSERIES = 'COMICSERIES',
  COMICISSUE = 'COMICISSUE',
  CREATOR = 'CREATOR',
}

export enum PrivacyType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export type ListModel = {
  id: string;
  name: string;
  description: string;
  bannerImageUrl: string;
  type: ListType;
  privacyType: PrivacyType;
  userId: number;
  uuids: string[];
  comicSeries?: (ComicSeriesModel | null)[] | null | undefined;
}

export type UserModel = {
  id: string;
  createdAt: number;
  updatedAt: number | null;
  name: string | null;
  email: string;
  username: string | null;
  isEmailVerified: boolean;
  resetPasswordToken: string | null;
  resetPasswordExpiry: number | null;
  googleId: string | null;
  appleId: string | null;
  ageRange: UserAgeRange | null;
  birthYear: number | null;
  blueskyDid: string | null;
}

export type UserSeriesSubscriptionModel = {
  id: number;
  createdAt: number;
  updatedAt: number | null;
  userId: number;
  seriesUuid: string;
}

export type UserDeviceModel = {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
  userId: number;
  fcmToken: string;
  platform: string;
  isProvisional: boolean | null;
}

export type NotificationPreferenceModel = {
  id: number;
  createdAt: number;
  updatedAt: number | null;
  userId: number;
  notificationType: NotificationType;
  value: string | null;
}