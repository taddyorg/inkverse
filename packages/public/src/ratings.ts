import { ContentRating } from './graphql/types.js';

export const allowedRatingsForType = new Set([
  ContentRating.COMICSERIES_BABY,
  ContentRating.COMICSERIES_KIDS,
  ContentRating.COMICSERIES_TEENS,
  ContentRating.COMICSERIES_MATURE_TEENS,
  ContentRating.COMICSERIES_ADULTS,
])

const allRatingsSet: Set<ContentRating> = new Set(Object.values(ContentRating))

export function safeContentRating(rating: ContentRating | null): ContentRating | null {
  if (!rating) return null;
  else if (!allRatingsSet.has(rating)) return null;
  return rating;
}

export function getPrettyContentRating(rating: ContentRating): string {
  switch(rating){
    case ContentRating.COMICSERIES_BABY:
      return "Ages 0-5"
    case ContentRating.COMICSERIES_KIDS:
      return "Ages 6+"
    case ContentRating.COMICSERIES_TEENS:
      return "Ages 13+"
    case ContentRating.COMICSERIES_MATURE_TEENS:
      return "Ages 15+"
    case ContentRating.COMICSERIES_ADULTS:
      return "Ages 18+"
    default:
      return rating.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).slice(1).join(" ")
  }
}