import { LinkType } from './graphql/types.js';

const HTTPS: string = "https://";

const allLinkTypesSet = new Set(Object.values(LinkType))

export function safeLinkType(type?: string): LinkType | null {
  if (!type) return null;
  else if (!allLinkTypesSet.has(type as LinkType)) return null;
  return type as LinkType;
}

export function getPrettyLinkType(linkType: LinkType): string {
  switch (linkType) {
    case "KO_FI":
      return "Ko-fi"
    default:
      return linkType.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase() }).join(" ")
  }
}

export function getLinkBase(linkType: LinkType): string | undefined {
  switch (linkType) {
    case LinkType.INSTAGRAM:
      return "instagram.com/"
    case LinkType.YOUTUBE:
      return "youtube.com/"
    case LinkType.TIKTOK:
      return "tiktok.com/@"
    case LinkType.PATREON:
      return "patreon.com/"
    case LinkType.KO_FI:
      return "ko-fi.com/"
    case LinkType.TWITTER:
      return "twitter.com/"
    case LinkType.FACEBOOK:
      return "facebook.com/"
    case LinkType.TWITCH:
      return "twitch.tv/"
    case LinkType.SNAPCHAT:
      return "snapchat.com/add/"
    case LinkType.REDDIT:
      return "reddit.com/r/"
    case LinkType.DISCORD:
      return "discord.gg/"
    case LinkType.TELEGRAM:
      return "t.me/"
    case LinkType.PINTEREST:
      return "pinterest.com/"
    case LinkType.TUMBLR:
      return "tumblr.com/"
    case LinkType.SPOTIFY:
      return "open.spotify.com/"
    case LinkType.SOUNDCLOUD:
      return "soundcloud.com/"
    case LinkType.BANDCAMP:
      return "bandcamp.com/"
    case LinkType.VIMEO:
      return "vimeo.com/"
    case LinkType.WECHAT:
      return "wechat.com/"
    case LinkType.WHATSAPP:
      return "chat.whatsapp.com/"
    case LinkType.WEBSITE:
    case LinkType.MERCH_STORE:
      return HTTPS
    case LinkType.MASTODON:
      return "@"
    case LinkType.LINKTREE:
      return "linktr.ee/"
    case LinkType.ETSY:
      return "etsy.com/shop/"
    case LinkType.EMAIL:
    default:
      return 
  }
}

export function getBaseLinkForSchema(linkType: LinkType, linkValue = ''): string {
  const linkbase = getLinkBase(linkType);
  if (linkType === LinkType.EMAIL) { return ''}
  else if (linkType === LinkType.MASTODON) {
    const mastodonSplitValues = linkValue.split("@")
    if (mastodonSplitValues.length !== 2) { return '' }
    return `${HTTPS}${mastodonSplitValues[1]}/@`
  }else if (linkbase === HTTPS) return linkbase
  else return `${HTTPS}${linkbase}`
}

export function getLinkValueForSchema(linkType: LinkType, linkValue: string): string | undefined {
  if (linkType === LinkType.MASTODON) {
    const mastodonSplitValues = linkValue.split("@")
    if (mastodonSplitValues.length !== 2) { return }
    return mastodonSplitValues[0];
  }else { return linkValue; }
}

export function getFullLink(linkType: LinkType, linkValue: string): string | undefined {
  const linkbase = getLinkBase(linkType)
  if (linkType === LinkType.EMAIL) return `mailto:${linkValue}`
  else if (linkType === LinkType.MASTODON) {
    const mastodonSplitValues = linkValue.split("@")
    if (mastodonSplitValues.length !== 2) { return }
    return `${HTTPS}${mastodonSplitValues[0]}/@${mastodonSplitValues[1]}`
  } else if (linkbase === HTTPS) return `${linkbase}${linkValue}`
  else return `${HTTPS}${linkbase}${linkValue}`
}

export const skipLinkBaseSet = new Set([LinkType.EMAIL])
