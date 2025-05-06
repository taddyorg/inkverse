import { Country } from './graphql/types.js';

export const rawAllCountries: Country[] = Object.values(Country);

const allCountriesSorted: Country[] = rawAllCountries.sort()

const allCountriesSet = new Set(allCountriesSorted)

const primaryCountries: Country[] = [
  Country.UNITED_STATES_OF_AMERICA,
  Country.UNITED_KINGDOM,
  Country.CANADA,
  Country.AUSTRALIA,
  Country.GERMANY,
  Country.SPAIN,
  Country.FRANCE,
  Country.KOREA_SOUTH,
  Country.JAPAN,
  Country.CHINA,
  Country.BRAZIL,
  Country.INDIA,
  Country.NIGERIA,
]

const primaryCountriesSet: Set<Country> = new Set(primaryCountries)

export const allCountries: Country[] = [...primaryCountries, ...allCountriesSorted.filter(country => !primaryCountriesSet.has(country))]

export function safeCountry(country: Country | null): Country | null {
  if (!country) return null;
  else if (!allCountriesSet.has(country)) return null;
  return country;
}

export function getPrettyCountry(country: Country): string {
  switch(country){
    case Country.UNITED_STATES_OF_AMERICA:
      return "USA"
    case Country.UNITED_KINGDOM:
      return "UK"
    case Country.KOREA_SOUTH:
      return "South Korea"
    case Country.KOREA_NORTH:
      return "North Korea"
    case Country.MOLDOVA_THE_REPUBLIC:
      return "Moldova"
    case Country.VIRGIN_ISLANDS_US:
      return "Virgin Islands (US)"
    case Country.VIRGIN_ISLANDS_BRITISH:
      return "Virgin Islands (British)"
    case Country.MINOR_OUTLYING_ISLANDS_US:
      return "Minor Outlying Islands (US)"
    case Country.CURACAO:
      return "Curaçao"
    case Country.SAINT_HELENA_ASCENSION_AND_TRISTAN_DA_CUNHA:
      return "Saint Helena, Ascension and Tristan da Cunha"
    default:
        return country.split("_").map(word => { return word[0]?.toUpperCase() + word.slice(1)?.toLowerCase()} ).join(" ")
  }
}