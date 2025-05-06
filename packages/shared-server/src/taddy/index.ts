import { GraphQLClient, gql } from 'graphql-request';
import { get } from 'lodash-es';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

export async function taddyGraphqlRequest(query: string, variables: any): Promise<Record<string, any> | undefined> {
  const endpointUrl = "https://api.taddy.org/";

  if (!process.env.TADDY_USER_ID || !process.env.TADDY_API_KEY) {
    throw new Error("TADDY_USER_ID and TADDY_API_KEY must be set");
  }
    
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Inkverse shared/1.0',
    'X-USER-ID': process.env.TADDY_USER_ID,
    'X-API-KEY': process.env.TADDY_API_KEY,
  }
  
  try {
    const client = new GraphQLClient(endpointUrl, { headers })
    const data = await client.request(query, variables)
    
    // const comicSeries = get(data, 'search.comicSeries', []);
    // console.log('comicSeries.length', comicSeries?.length || 0);
    
    return data as Record<string, any>;
  }catch(e) {
    console.log("inside sentTaddyGraphqlRequest", query, variables, e)
    return undefined;
  }
}

const SEARCH_QUERY = gql`
  query search($term: String, $page: Int, $limitPerPage: Int, $filterForTypes: [SearchContentType], $filterForTags: [String], $filterForGenres: [Genre]) {
    search(term: $term, page: $page, limitPerPage: $limitPerPage, filterForTypes: $filterForTypes, filterForTags: $filterForTags, filterForGenres: $filterForGenres) {
      searchId
      comicSeries {
        uuid
      }
    }
  }
`

const GET_COMICSERIES_QUERY = gql`
  query GetComicSeries($uuid: ID) {
    getComicSeries(uuid: $uuid) {
      uuid
      name
      description
      status
      hash
      issuesHash
      datePublished
      coverImageAsString
      bannerImageAsString
      thumbnailImageAsString
      tags
      genres
      language
      contentRating
      seriesType
      seriesLayout
      sssUrl
      sssOwnerName
      sssOwnerPublicEmail
      copyright
      isBlocked
      totalIssuesCount
      hostingProvider{
        uuid
        sssUrl
      }
      scopesForExclusiveContent
    }
  }
`

const GET_COMICSERIES_WITH_CREATOR_QUERY = gql`
  query GetComicSeriesWithCreator($uuid: ID) {
    getComicSeries(uuid: $uuid) {
      uuid
      creators {
        uuid
        name
        bio
        hash
        contentHash
        avatarImageAsString
        tags
        country
        linksAsString
        sssUrl
        sssOwnerName
        sssOwnerPublicEmail
        copyright
        isBlocked
      }
    }
  }
`

const GET_COMICSERIES_WITH_ISSUES_QUERY = gql`
  query GetComicSeriesWithIssues($uuid: ID, $page: Int, $limitPerPage: Int) {
    getComicSeries(uuid: $uuid) {
      uuid
      name
      issues(page: $page, limitPerPage: $limitPerPage) {
        uuid
      }
    }
  }
`

const GET_COMICISSUE_QUERY = gql`
  query GetComicIssue($uuid: ID) {
    getComicIssue(uuid: $uuid) {
      uuid
      seriesUuid
      name
      creatorNote
      pushNotificationMessage
      hash
      storiesHash
      datePublished
      bannerImageAsString
      thumbnailImageAsString
      stories{
        uuid
        hash
        storyImageAsString
      }
      position
      scopesForExclusiveContent
      dateExclusiveContentIsAvailable
      isRemoved
      isBlocked
    }
  }
`

const GET_CREATOR_QUERY = gql`
  query GetCreator($uuid: ID) {
    getCreator(uuid: $uuid) {
      uuid
      name
      bio
      hash
      contentHash
      avatarImageAsString
      tags
      country
      linksAsString
      sssUrl
      sssOwnerName
      sssOwnerPublicEmail
      copyright
      isBlocked
      totalContentCount
    }
  }
`

const GET_CREATOR_WITH_CONTENT_QUERY = gql`
  query GetCreatorWithContent($uuid: ID, $page: Int) {
    getCreator(uuid: $uuid) {
      uuid
      name
      content(page: $page) {
        uuid
      }
    }
  }
`

const GET_CREATORCONTENT_QUERY = gql`
  query GetCreatorContent($uuid: ID) {
    getCreatorContent(uuid: $uuid) {
      uuid
      hash
      creatorUuid
      contentUuid
      contentType
      roles
      position
      contentPosition
    }
  }
`

export {
  GET_COMICSERIES_QUERY,
  GET_COMICSERIES_WITH_CREATOR_QUERY  ,
  GET_COMICSERIES_WITH_ISSUES_QUERY,
  GET_COMICISSUE_QUERY,
  GET_CREATOR_QUERY,
  GET_CREATOR_WITH_CONTENT_QUERY,
  GET_CREATORCONTENT_QUERY,
  SEARCH_QUERY
}