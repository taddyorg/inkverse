import { Language } from './graphql/types.js';

const allLanguagesSorted: Language[] = Object.values(Language).sort()

const primaryLanguages: Language[] = [
  Language.ENGLISH,
  Language.SPANISH,
  Language.FRENCH,
  Language.KOREAN,
  Language.JAPANESE,
  Language.CHINESE,
]

const primaryLanguagesSet: Set<Language> = new Set(primaryLanguages)
const allLanguagesSet: Set<Language> = new Set(allLanguagesSorted)

export const allLanguages: Language[] = [...primaryLanguages, ...allLanguagesSorted.filter(lang => !primaryLanguagesSet.has(lang))]

export function getPrettyLanguage(language: Language): string {
  return language.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).join(" ")
}

export function safeLanguage(language: Language | null): Language | null {
  if (!language) return null;
  else if (!allLanguagesSet.has(language)) return null;
  return language;
}