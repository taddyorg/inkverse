import { ContentRole } from './graphql/types.js';

const allContentRolesSet = new Set(Object.values(ContentRole));

export function safeContentRole(role: string | undefined): ContentRole | null {
  if (!role) return null;
  else if (!allContentRolesSet.has(role as ContentRole)) return null;
  return role as ContentRole;
}

export function getPrettyRoleName(role: ContentRole): string {
  switch(role){
    case ContentRole.COMICSERIES_ARTIST_PENCILER:
      return "Penciler (Artist)"
    case ContentRole.COMICSERIES_ARTIST_INKER:
      return "Inker (Artist)"
    case ContentRole.COMICSERIES_ARTIST_COLORIST:
      return "Colorist (Artist)"
    case ContentRole.COMICSERIES_ARTIST_LETTERER:
      return "Letterer (Artist)"
    default:
      return role.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).slice(1).join(" ")
  }
}

export function getRoleDescription(role: ContentRole): string {
  switch(role){
    case ContentRole.COMICSERIES_ARTIST:
      return "An individual who creates artwork for the comic."
    case ContentRole.COMICSERIES_ARTIST_PENCILER:
      return "An individual who draws the primary narrative artwork."
    case ContentRole.COMICSERIES_ARTIST_INKER:
      return "An individual who traces over pencil drawings to provide a final line."  
    case ContentRole.COMICSERIES_ARTIST_COLORIST:
      return "An individual who adds color to inked drawings."
    case ContentRole.COMICSERIES_ARTIST_LETTERER:
      return "An individual who adds lettering, including speech balloons and sound effects"
    case ContentRole.COMICSERIES_WRITER:
      return "An individual who writes the story or dialogue for the comic."
    case ContentRole.COMICSERIES_PRODUCER:
      return "An individual who is responsible for helping craft the creative direction and overall final production."
    case ContentRole.COMICSERIES_EDITOR:
      return "An individual who is responsible for reviewing and editing the comic to ensure the story and artwork are consistent, creative & engaging."
    case ContentRole.COMICSERIES_TRANSLATOR:
      return "An individual who converts dialog from one language to another"
  }
}