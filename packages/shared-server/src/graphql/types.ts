import type { GraphQLResolveInfo } from 'graphql';
import type { ComicSeriesModel, ComicIssueModel, ComicStoryModel, CreatorModel, CreatorContentModel, ListModel } from '../database/types.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/**  Comic Issue Details  */
export type ComicIssue = {
  __typename?: 'ComicIssue';
  /**  Stringified JSON details for the banner art. Convert to JSON to use. */
  bannerImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Details on the comic for which this issue belongs to  */
  comicSeries?: Maybe<ComicSeries>;
  /**  Short note from the creator for the issue  */
  creatorNote?: Maybe<Scalars['String']['output']>;
  /**  The date when the issue (exclusive content) becomes available through the scope (epoch time in seconds) */
  dateExclusiveContentAvailable?: Maybe<Scalars['Int']['output']>;
  /**  Date when the issue was published (Epoch time in seconds)  */
  datePublished?: Maybe<Scalars['Int']['output']>;
  /**  A different hash means that details for this issue have updated since the last hash  */
  hash?: Maybe<Scalars['String']['output']>;
  /**  If the content has violated Taddy's distribution policies for illegal or harmful content it will be blocked from getting any updates  */
  isBlocked?: Maybe<Scalars['Boolean']['output']>;
  /**  If the issue has now been removed from the SSS Feed  */
  isRemoved?: Maybe<Scalars['Boolean']['output']>;
  /**  The name (title) of the issue  */
  name?: Maybe<Scalars['String']['output']>;
  /**  Next issue in the series  */
  nextIssue?: Maybe<ComicIssue>;
  /**  Position of the issue in the series  */
  position?: Maybe<Scalars['Int']['output']>;
  /**  Preview of the first 5 story image urls  */
  previewStoryImageUrls?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  The scopes for the exclusive content - e.g. 'patreon'  */
  scopesForExclusiveContent?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  Unique identifier for a comic series this issue belongs to  */
  seriesUuid: Scalars['ID']['output'];
  /**  Details on all the stories that make up this issue  */
  stories?: Maybe<Array<Maybe<ComicStory>>>;
  /**  A different hash means that details for the stories that make up this issue have updated since the last hash  */
  storiesHash?: Maybe<Scalars['String']['output']>;
  /**  Stringified JSON details for the thumbnail art. Convert to JSON to use. */
  thumbnailImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Unique identifier for a comic issue  */
  uuid: Scalars['ID']['output'];
};

export type ComicIssueForSeries = {
  __typename?: 'ComicIssueForSeries';
  /**  The issues  */
  issues?: Maybe<Array<Maybe<ComicIssue>>>;
  /**  Series uuid  */
  seriesUuid: Scalars['ID']['output'];
};

/**  Comic Series Details  */
export type ComicSeries = {
  __typename?: 'ComicSeries';
  /**  Stringified JSON details for the banner art. Convert to JSON to use.  */
  bannerImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Rating of the comic series  */
  contentRating?: Maybe<ContentRating>;
  /**  Copyright details for this feed  */
  copyright?: Maybe<Scalars['String']['output']>;
  /**  Stringified JSON details for the cover art. Convert to JSON to use.  */
  coverImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Creators of the comic series  */
  creators?: Maybe<Array<Maybe<Creator>>>;
  /**  Date when the comic series was published (Epoch time in seconds)  */
  datePublished?: Maybe<Scalars['Int']['output']>;
  /**  The description for a comic series  */
  description?: Maybe<Scalars['String']['output']>;
  /**  1st Genre for the comic series  */
  genre0?: Maybe<Genre>;
  /**  2nd Genre for the comic series  */
  genre1?: Maybe<Genre>;
  /**  3rd Genre for the comic series   */
  genre2?: Maybe<Genre>;
  /**  A hash of all comic details. It may be useful for you to save this property in your database and compare it to know if any comic details have updated since the last time you checked  */
  hash?: Maybe<Scalars['String']['output']>;
  /**  The UUID of the hosting provider for this comic series' SSS feed  */
  hostingProviderUuid?: Maybe<Scalars['ID']['output']>;
  /**  If the content has violated Taddy's distribution policies for illegal or harmful content it will be blocked from getting any updates  */
  isBlocked?: Maybe<Scalars['Boolean']['output']>;
  /**  If the comic series is finished / complete  */
  isCompleted?: Maybe<Scalars['Boolean']['output']>;
  /**  Number of issues in a comic series  */
  issueCount?: Maybe<Scalars['Int']['output']>;
  /**  A hash of the details for all issues for this comic. It may be useful for you to save this property in your database and compare it to know if there are any new or updated issues since the last time you checked  */
  issuesHash?: Maybe<Scalars['String']['output']>;
  /**  The language the comic series is in  */
  language?: Maybe<Language>;
  /**  Layout type of the comic series  */
  layoutType?: Maybe<ComicSeriesLayoutType>;
  /**  The name (title) for a comic series  */
  name?: Maybe<Scalars['String']['output']>;
  /**  The scopes for the exclusive content - e.g. 'patreon'  */
  scopesForExclusiveContent?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  Type of the comic series  */
  seriesType?: Maybe<ComicSeriesType>;
  /**  The unique url ending for a comic series  */
  shortUrl?: Maybe<Scalars['String']['output']>;
  /**  Name to use for contacting the owner of this feed  */
  sssOwnerName?: Maybe<Scalars['String']['output']>;
  /**  Email to use for contacting the owner of this feed  */
  sssOwnerPublicEmail?: Maybe<Scalars['String']['output']>;
  /**  Url for the comic series' SSS feed  */
  sssUrl?: Maybe<Scalars['String']['output']>;
  /**  The status of the comic series  */
  status?: Maybe<SeriesStatus>;
  /**  Tags for the comic series  */
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  Stringified JSON details for the thumbnail art. Convert to JSON to use.  */
  thumbnailImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Unique identifier for this comic  */
  uuid: Scalars['ID']['output'];
};

/**  Layout types for comic series  */
export enum ComicSeriesLayoutType {
  VERTICAL_SCROLL_TOP_TO_BOTTOM = 'VERTICAL_SCROLL_TOP_TO_BOTTOM'
}

/**  Type of comic series  */
export enum ComicSeriesType {
  WEBTOON = 'WEBTOON'
}

/**  Comic Story Details  */
export type ComicStory = {
  __typename?: 'ComicStory';
  /**  Details on the comic issue that this story belongs to  */
  comicIssue?: Maybe<ComicIssue>;
  /**  Details on the comic series that this story belongs to  */
  comicSeries?: Maybe<ComicSeries>;
  /**  A different hash means that details for this story have updated since the last hash  */
  hash?: Maybe<Scalars['String']['output']>;
  /**  Height of the story image  */
  height?: Maybe<Scalars['Int']['output']>;
  /**  If the story has now been removed from the SSS Feed  */
  isRemoved?: Maybe<Scalars['Boolean']['output']>;
  /**  Unique identifier for a comic issue this story belongs to  */
  issueUuid: Scalars['ID']['output'];
  /**  Unique identifier for a comic series this story belongs to  */
  seriesUuid: Scalars['ID']['output'];
  /**  Stringified JSON details for the story art. Convert to JSON to use. */
  storyImageAsString?: Maybe<Scalars['String']['output']>;
  /**  Unique identifier for a comic story  */
  uuid: Scalars['ID']['output'];
  /**  Width of the story image  */
  width?: Maybe<Scalars['Int']['output']>;
};

/**  Content rating for different media types. Follows format: TYPE_RATING  */
export enum ContentRating {
  COMICSERIES_ADULTS = 'COMICSERIES_ADULTS',
  COMICSERIES_BABY = 'COMICSERIES_BABY',
  COMICSERIES_KIDS = 'COMICSERIES_KIDS',
  COMICSERIES_MATURE_TEENS = 'COMICSERIES_MATURE_TEENS',
  COMICSERIES_PORNOGRAPHY = 'COMICSERIES_PORNOGRAPHY',
  COMICSERIES_TEENS = 'COMICSERIES_TEENS'
}

/**  Content roles for different media types. Follows format: TYPE_ROLE_SUBROLE  */
export enum ContentRole {
  COMICSERIES_ARTIST = 'COMICSERIES_ARTIST',
  COMICSERIES_ARTIST_COLORIST = 'COMICSERIES_ARTIST_COLORIST',
  COMICSERIES_ARTIST_INKER = 'COMICSERIES_ARTIST_INKER',
  COMICSERIES_ARTIST_LETTERER = 'COMICSERIES_ARTIST_LETTERER',
  COMICSERIES_ARTIST_PENCILER = 'COMICSERIES_ARTIST_PENCILER',
  COMICSERIES_EDITOR = 'COMICSERIES_EDITOR',
  COMICSERIES_PRODUCER = 'COMICSERIES_PRODUCER',
  COMICSERIES_TRANSLATOR = 'COMICSERIES_TRANSLATOR',
  COMICSERIES_WRITER = 'COMICSERIES_WRITER'
}

/**  Countries (ISO 3166-1 https://en.wikipedia.org/wiki/ISO_3166-1)  */
export enum Country {
  AFGHANISTAN = 'AFGHANISTAN',
  ALAND_ISLANDS = 'ALAND_ISLANDS',
  ALBANIA = 'ALBANIA',
  ALGERIA = 'ALGERIA',
  AMERICAN_SAMOA = 'AMERICAN_SAMOA',
  ANDORRA = 'ANDORRA',
  ANGOLA = 'ANGOLA',
  ANGUILLA = 'ANGUILLA',
  ANTARCTICA = 'ANTARCTICA',
  ANTIGUA_AND_BARBUDA = 'ANTIGUA_AND_BARBUDA',
  ARGENTINA = 'ARGENTINA',
  ARMENIA = 'ARMENIA',
  ARUBA = 'ARUBA',
  AUSTRALIA = 'AUSTRALIA',
  AUSTRIA = 'AUSTRIA',
  AZERBAIJAN = 'AZERBAIJAN',
  BAHAMAS = 'BAHAMAS',
  BAHRAIN = 'BAHRAIN',
  BANGLADESH = 'BANGLADESH',
  BARBADOS = 'BARBADOS',
  BELARUS = 'BELARUS',
  BELGIUM = 'BELGIUM',
  BELIZE = 'BELIZE',
  BENIN = 'BENIN',
  BERMUDA = 'BERMUDA',
  BHUTAN = 'BHUTAN',
  BOLIVIA_PLURINATIONAL_STATE_OF = 'BOLIVIA_PLURINATIONAL_STATE_OF',
  BONAIRE_SINT_EUSTATIUS_AND_SABA = 'BONAIRE_SINT_EUSTATIUS_AND_SABA',
  BOSNIA_AND_HERZEGOVINA = 'BOSNIA_AND_HERZEGOVINA',
  BOTSWANA = 'BOTSWANA',
  BOUVET_ISLAND = 'BOUVET_ISLAND',
  BRAZIL = 'BRAZIL',
  BRITISH_INDIAN_OCEAN_TERRITORY_THE = 'BRITISH_INDIAN_OCEAN_TERRITORY_THE',
  BRUNEI_DARUSSALAM = 'BRUNEI_DARUSSALAM',
  BULGARIA = 'BULGARIA',
  BURKINA_FASO = 'BURKINA_FASO',
  BURUNDI = 'BURUNDI',
  CABO_VERDE = 'CABO_VERDE',
  CAMBODIA = 'CAMBODIA',
  CAMEROON = 'CAMEROON',
  CANADA = 'CANADA',
  CAYMAN_ISLANDS = 'CAYMAN_ISLANDS',
  CENTRAL_AFRICAN_REPUBLIC = 'CENTRAL_AFRICAN_REPUBLIC',
  CHAD = 'CHAD',
  CHILE = 'CHILE',
  CHINA = 'CHINA',
  CHRISTMAS_ISLAND = 'CHRISTMAS_ISLAND',
  COCOS_KEELING_ISLANDS = 'COCOS_KEELING_ISLANDS',
  COLOMBIA = 'COLOMBIA',
  COMOROS = 'COMOROS',
  CONGO = 'CONGO',
  CONGO_THE_DEMOCRATIC_REPUBLIC_OF = 'CONGO_THE_DEMOCRATIC_REPUBLIC_OF',
  COOK_ISLANDS = 'COOK_ISLANDS',
  COSTA_RICA = 'COSTA_RICA',
  COTE_D_IVOIRE = 'COTE_D_IVOIRE',
  CROATIA = 'CROATIA',
  CUBA = 'CUBA',
  CURACAO = 'CURACAO',
  CYPRUS = 'CYPRUS',
  CZECHIA = 'CZECHIA',
  DENMARK = 'DENMARK',
  DJIBOUTI = 'DJIBOUTI',
  DOMINICA = 'DOMINICA',
  DOMINICAN_REPUBLIC = 'DOMINICAN_REPUBLIC',
  ECUADOR = 'ECUADOR',
  EGYPT = 'EGYPT',
  EL_SALVADOR = 'EL_SALVADOR',
  EQUATORIAL_GUINEA = 'EQUATORIAL_GUINEA',
  ERITREA = 'ERITREA',
  ESTONIA = 'ESTONIA',
  ESWATINI = 'ESWATINI',
  ETHIOPIA = 'ETHIOPIA',
  FALKLAND_ISLANDS_THE_MALVINAS = 'FALKLAND_ISLANDS_THE_MALVINAS',
  FAROE_ISLANDS = 'FAROE_ISLANDS',
  FIJI = 'FIJI',
  FINLAND = 'FINLAND',
  FRANCE = 'FRANCE',
  FRENCH_GUIANA = 'FRENCH_GUIANA',
  FRENCH_POLYNESIA = 'FRENCH_POLYNESIA',
  FRENCH_SOUTHERN_TERRITORIES = 'FRENCH_SOUTHERN_TERRITORIES',
  GABON = 'GABON',
  GAMBIA = 'GAMBIA',
  GEORGIA = 'GEORGIA',
  GERMANY = 'GERMANY',
  GHANA = 'GHANA',
  GIBRALTAR = 'GIBRALTAR',
  GREECE = 'GREECE',
  GREENLAND = 'GREENLAND',
  GRENADA = 'GRENADA',
  GUADELOUPE = 'GUADELOUPE',
  GUAM = 'GUAM',
  GUATEMALA = 'GUATEMALA',
  GUERNSEY = 'GUERNSEY',
  GUINEA = 'GUINEA',
  GUINEA_BISSAU = 'GUINEA_BISSAU',
  GUYANA = 'GUYANA',
  HAITI = 'HAITI',
  HEARD_ISLAND_AND_MCDONALD_ISLANDS = 'HEARD_ISLAND_AND_MCDONALD_ISLANDS',
  HOLY_SEE = 'HOLY_SEE',
  HONDURAS = 'HONDURAS',
  HONG_KONG = 'HONG_KONG',
  HUNGARY = 'HUNGARY',
  ICELAND = 'ICELAND',
  INDIA = 'INDIA',
  INDONESIA = 'INDONESIA',
  IRAN = 'IRAN',
  IRAQ = 'IRAQ',
  IRELAND = 'IRELAND',
  ISLE_OF_MAN = 'ISLE_OF_MAN',
  ISRAEL = 'ISRAEL',
  ITALY = 'ITALY',
  JAMAICA = 'JAMAICA',
  JAPAN = 'JAPAN',
  JERSEY = 'JERSEY',
  JORDAN = 'JORDAN',
  KAZAKHSTAN = 'KAZAKHSTAN',
  KENYA = 'KENYA',
  KIRIBATI = 'KIRIBATI',
  KOREA_NORTH = 'KOREA_NORTH',
  KOREA_SOUTH = 'KOREA_SOUTH',
  KUWAIT = 'KUWAIT',
  KYRGYZSTAN = 'KYRGYZSTAN',
  LAO_PEOPLES_DEMOCRATIC_REPUBLIC_THE = 'LAO_PEOPLES_DEMOCRATIC_REPUBLIC_THE',
  LATVIA = 'LATVIA',
  LEBANON = 'LEBANON',
  LESOTHO = 'LESOTHO',
  LIBERIA = 'LIBERIA',
  LIBYA = 'LIBYA',
  LIECHTENSTEIN = 'LIECHTENSTEIN',
  LITHUANIA = 'LITHUANIA',
  LUXEMBOURG = 'LUXEMBOURG',
  MACAO = 'MACAO',
  MADAGASCAR = 'MADAGASCAR',
  MALAWI = 'MALAWI',
  MALAYSIA = 'MALAYSIA',
  MALDIVES = 'MALDIVES',
  MALI = 'MALI',
  MALTA = 'MALTA',
  MARSHALL_ISLANDS = 'MARSHALL_ISLANDS',
  MARTINIQUE = 'MARTINIQUE',
  MAURITANIA = 'MAURITANIA',
  MAURITIUS = 'MAURITIUS',
  MAYOTTE = 'MAYOTTE',
  MEXICO = 'MEXICO',
  MICRONESIA_FEDERATED_STATES = 'MICRONESIA_FEDERATED_STATES',
  MINOR_OUTLYING_ISLANDS_US = 'MINOR_OUTLYING_ISLANDS_US',
  MOLDOVA_THE_REPUBLIC = 'MOLDOVA_THE_REPUBLIC',
  MONACO = 'MONACO',
  MONGOLIA = 'MONGOLIA',
  MONTENEGRO = 'MONTENEGRO',
  MONTSERRAT = 'MONTSERRAT',
  MOROCCO = 'MOROCCO',
  MOZAMBIQUE = 'MOZAMBIQUE',
  MYANMAR = 'MYANMAR',
  NAMIBIA = 'NAMIBIA',
  NAURU = 'NAURU',
  NEPAL = 'NEPAL',
  NETHERLANDS = 'NETHERLANDS',
  NEW_CALEDONIA = 'NEW_CALEDONIA',
  NEW_ZEALAND = 'NEW_ZEALAND',
  NICARAGUA = 'NICARAGUA',
  NIGER = 'NIGER',
  NIGERIA = 'NIGERIA',
  NIUE = 'NIUE',
  NORFOLK_ISLAND = 'NORFOLK_ISLAND',
  NORTHERN_MARIANA_ISLANDS = 'NORTHERN_MARIANA_ISLANDS',
  NORTH_MACEDONIA = 'NORTH_MACEDONIA',
  NORWAY = 'NORWAY',
  OMAN = 'OMAN',
  PAKISTAN = 'PAKISTAN',
  PALAU = 'PALAU',
  PALESTINE_STATE = 'PALESTINE_STATE',
  PANAMA = 'PANAMA',
  PAPUA_NEW_GUINEA = 'PAPUA_NEW_GUINEA',
  PARAGUAY = 'PARAGUAY',
  PERU = 'PERU',
  PHILIPPINES = 'PHILIPPINES',
  PITCAIRN = 'PITCAIRN',
  POLAND = 'POLAND',
  PORTUGAL = 'PORTUGAL',
  PUERTO_RICO = 'PUERTO_RICO',
  QATAR = 'QATAR',
  REUNION = 'REUNION',
  ROMANIA = 'ROMANIA',
  RUSSIA = 'RUSSIA',
  RWANDA = 'RWANDA',
  SAINT_BARTHELEMY = 'SAINT_BARTHELEMY',
  SAINT_HELENA_ASCENSION_AND_TRISTAN_DA_CUNHA = 'SAINT_HELENA_ASCENSION_AND_TRISTAN_DA_CUNHA',
  SAINT_KITTS_AND_NEVIS = 'SAINT_KITTS_AND_NEVIS',
  SAINT_LUCIA = 'SAINT_LUCIA',
  SAINT_MARTIN_FRENCH_PART = 'SAINT_MARTIN_FRENCH_PART',
  SAINT_PIERRE_AND_MIQUELON = 'SAINT_PIERRE_AND_MIQUELON',
  SAINT_VINCENT_AND_THE_GRENADINES = 'SAINT_VINCENT_AND_THE_GRENADINES',
  SAMOA = 'SAMOA',
  SAN_MARINO = 'SAN_MARINO',
  SAO_TOME_AND_PRINCIPE = 'SAO_TOME_AND_PRINCIPE',
  SAUDI_ARABIA = 'SAUDI_ARABIA',
  SENEGAL = 'SENEGAL',
  SERBIA = 'SERBIA',
  SEYCHELLES = 'SEYCHELLES',
  SIERRA_LEONE = 'SIERRA_LEONE',
  SINGAPORE = 'SINGAPORE',
  SINT_MAARTEN_DUTCH_PART = 'SINT_MAARTEN_DUTCH_PART',
  SLOVAKIA = 'SLOVAKIA',
  SLOVENIA = 'SLOVENIA',
  SOLOMON_ISLANDS = 'SOLOMON_ISLANDS',
  SOMALIA = 'SOMALIA',
  SOUTH_AFRICA = 'SOUTH_AFRICA',
  SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS = 'SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS',
  SOUTH_SUDAN = 'SOUTH_SUDAN',
  SPAIN = 'SPAIN',
  SRI_LANKA = 'SRI_LANKA',
  SUDAN = 'SUDAN',
  SURINAME = 'SURINAME',
  SVALBARD_AND_JAN_MAYEN = 'SVALBARD_AND_JAN_MAYEN',
  SWEDEN = 'SWEDEN',
  SWITZERLAND = 'SWITZERLAND',
  SYRIA = 'SYRIA',
  TAIWAN = 'TAIWAN',
  TAJIKISTAN = 'TAJIKISTAN',
  TANZANIA = 'TANZANIA',
  THAILAND = 'THAILAND',
  TIMOR_LESTE = 'TIMOR_LESTE',
  TOGO = 'TOGO',
  TOKELAU = 'TOKELAU',
  TONGA = 'TONGA',
  TRINIDAD_AND_TOBAGO = 'TRINIDAD_AND_TOBAGO',
  TUNISIA = 'TUNISIA',
  TURKEY = 'TURKEY',
  TURKMENISTAN = 'TURKMENISTAN',
  TURKS_AND_CAICOS_ISLANDS = 'TURKS_AND_CAICOS_ISLANDS',
  TUVALU = 'TUVALU',
  UGANDA = 'UGANDA',
  UKRAINE = 'UKRAINE',
  UNITED_ARAB_EMIRATES = 'UNITED_ARAB_EMIRATES',
  UNITED_KINGDOM = 'UNITED_KINGDOM',
  UNITED_STATES_OF_AMERICA = 'UNITED_STATES_OF_AMERICA',
  URUGUAY = 'URUGUAY',
  UZBEKISTAN = 'UZBEKISTAN',
  VANUATU = 'VANUATU',
  VENEZUELA = 'VENEZUELA',
  VIETNAM = 'VIETNAM',
  VIRGIN_ISLANDS_BRITISH = 'VIRGIN_ISLANDS_BRITISH',
  VIRGIN_ISLANDS_US = 'VIRGIN_ISLANDS_US',
  WALLIS_AND_FUTUNA = 'WALLIS_AND_FUTUNA',
  WESTERN_SAHARA = 'WESTERN_SAHARA',
  YEMEN = 'YEMEN',
  ZAMBIA = 'ZAMBIA',
  ZIMBABWE = 'ZIMBABWE'
}

/**  Creator Details  */
export type Creator = {
  __typename?: 'Creator';
  /**  Stringified JSON details for the avatar image. Convert to JSON to use. */
  avatarImageAsString?: Maybe<Scalars['String']['output']>;
  /**  A short bio on the creator  */
  bio?: Maybe<Scalars['String']['output']>;
  /**  Comics for the creator  */
  comics?: Maybe<Array<Maybe<ComicSeries>>>;
  /**  A list of content for this creator  */
  content?: Maybe<Array<Maybe<CreatorContent>>>;
  /**  A hash of the details for all different content a creator makes. It may be useful for you to save this property in your database and compare it to know if there are any new or updated content since the last time you checked  */
  contentHash?: Maybe<Scalars['String']['output']>;
  /**  Copyright details for this feed  */
  copyright?: Maybe<Scalars['String']['output']>;
  /**  The country in which the creator is resides in or is from  */
  country?: Maybe<Country>;
  /**  Date when the creator feed was published (Epoch time in seconds)  */
  datePublished?: Maybe<Scalars['Int']['output']>;
  /**  A hash of all creator details. It may be useful for you to save this property in your database and compare it to know if any details have updated since the last time you checked  */
  hash?: Maybe<Scalars['String']['output']>;
  /**  If the content has violated Taddy's distribution policies for illegal or harmful content it will be blocked from getting any updates  */
  isBlocked?: Maybe<Scalars['Boolean']['output']>;
  /**  Links to creator's website, email, or social media  */
  links?: Maybe<Array<Maybe<LinkDetails>>>;
  /**  The name of the creator  */
  name?: Maybe<Scalars['String']['output']>;
  /**  The unqiue url ending for a comic  */
  shortUrl?: Maybe<Scalars['String']['output']>;
  /**  Name to use for contacting the owner of this feed  */
  sssOwnerName?: Maybe<Scalars['String']['output']>;
  /**  Email to use for contacting the owner of this feed  */
  sssOwnerPublicEmail?: Maybe<Scalars['String']['output']>;
  /**  Url for the creator's SSS feed  */
  sssUrl?: Maybe<Scalars['String']['output']>;
  /**  Tags for the creator  */
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  Unique identifier for this creator  */
  uuid: Scalars['ID']['output'];
};


/**  Creator Details  */
export type CreatorContentArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sortOrder?: InputMaybe<SortOrder>;
};

/**  CreatorContent Details  */
export type CreatorContent = {
  __typename?: 'CreatorContent';
  /**  If content is a comic - Details for the content  */
  comicseries?: Maybe<ComicSeries>;
  /**  Position on the content feed  */
  contentPosition?: Maybe<Scalars['Int']['output']>;
  /**  Content type  */
  contentType?: Maybe<TaddyType>;
  /**  Unique identifier for the content  */
  contentUuid?: Maybe<Scalars['ID']['output']>;
  /**  Unique identifier for the creator  */
  creatorUuid?: Maybe<Scalars['ID']['output']>;
  /**  A hash of all creatorcontent details  */
  hash?: Maybe<Scalars['String']['output']>;
  /**
   *  Unique identifier for this creatorcontent
   * @deprecated Use uuid instead
   */
  id?: Maybe<Scalars['ID']['output']>;
  /**  Position on the creator feed  */
  position?: Maybe<Scalars['Int']['output']>;
  /**  Roles for the creator for this content  */
  roles?: Maybe<Array<Maybe<ContentRole>>>;
  /**  Unique identifier for this creatorcontent  */
  uuid?: Maybe<Scalars['ID']['output']>;
};

/**  Link Details  */
export type CreatorLinkDetails = {
  __typename?: 'CreatorLinkDetails';
  /**  The uuid of the creator  */
  creatorUuid: Scalars['ID']['output'];
  /**  The type of link  */
  type?: Maybe<LinkType>;
  /**  The url for the link  */
  url?: Maybe<Scalars['String']['output']>;
};

/**  Documentation marketing pages for bam  */
export type Documentation = {
  __typename?: 'Documentation';
  /**  The id corresponding to an equivalent notion page  */
  id?: Maybe<Scalars['ID']['output']>;
  /**  All the text in the document  */
  text?: Maybe<Scalars['String']['output']>;
};

/**  Genres for different media types. Follows format: TYPE_GENRE_SUBGENRE  */
export enum Genre {
  COMICSERIES_ACTION = 'COMICSERIES_ACTION',
  COMICSERIES_ANIMALS = 'COMICSERIES_ANIMALS',
  COMICSERIES_BL = 'COMICSERIES_BL',
  COMICSERIES_COMEDY = 'COMICSERIES_COMEDY',
  COMICSERIES_CRIME = 'COMICSERIES_CRIME',
  COMICSERIES_DRAMA = 'COMICSERIES_DRAMA',
  COMICSERIES_DYSTOPIA = 'COMICSERIES_DYSTOPIA',
  COMICSERIES_EDUCATIONAL = 'COMICSERIES_EDUCATIONAL',
  COMICSERIES_FANTASY = 'COMICSERIES_FANTASY',
  COMICSERIES_GAMING = 'COMICSERIES_GAMING',
  COMICSERIES_GL = 'COMICSERIES_GL',
  COMICSERIES_HAREM = 'COMICSERIES_HAREM',
  COMICSERIES_HIGH_SCHOOL = 'COMICSERIES_HIGH_SCHOOL',
  COMICSERIES_HISTORICAL = 'COMICSERIES_HISTORICAL',
  COMICSERIES_HORROR = 'COMICSERIES_HORROR',
  COMICSERIES_ISEKAI = 'COMICSERIES_ISEKAI',
  COMICSERIES_LGBTQ = 'COMICSERIES_LGBTQ',
  COMICSERIES_MYSTERY = 'COMICSERIES_MYSTERY',
  COMICSERIES_POST_APOCALYPTIC = 'COMICSERIES_POST_APOCALYPTIC',
  COMICSERIES_ROMANCE = 'COMICSERIES_ROMANCE',
  COMICSERIES_SCI_FI = 'COMICSERIES_SCI_FI',
  COMICSERIES_SLICE_OF_LIFE = 'COMICSERIES_SLICE_OF_LIFE',
  COMICSERIES_SPORTS = 'COMICSERIES_SPORTS',
  COMICSERIES_SUPERHERO = 'COMICSERIES_SUPERHERO',
  COMICSERIES_SUPERNATURAL = 'COMICSERIES_SUPERNATURAL',
  COMICSERIES_THRILLER = 'COMICSERIES_THRILLER',
  COMICSERIES_ZOMBIES = 'COMICSERIES_ZOMBIES'
}

export type HomeScreenComicSeries = {
  __typename?: 'HomeScreenComicSeries';
  /**  List of comic series  */
  comicSeries?: Maybe<Array<Maybe<ComicSeries>>>;
  /**  Id of the home screen comic series  */
  id?: Maybe<Scalars['ID']['output']>;
};

export type HomeScreenCuratedList = {
  __typename?: 'HomeScreenCuratedList';
  /**  Id of the home screen curated list  */
  id?: Maybe<Scalars['ID']['output']>;
  /**  List of curated lists  */
  lists?: Maybe<Array<Maybe<List>>>;
};

/**  Languages (ISO 639-2 https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes)  */
export enum Language {
  ABKHAZIAN = 'ABKHAZIAN',
  AFAR = 'AFAR',
  AFRIKAANS = 'AFRIKAANS',
  AKAN = 'AKAN',
  ALBANIAN = 'ALBANIAN',
  AMHARIC = 'AMHARIC',
  ARABIC = 'ARABIC',
  ARAGONESE = 'ARAGONESE',
  ARMENIAN = 'ARMENIAN',
  ASSAMESE = 'ASSAMESE',
  AVARIC = 'AVARIC',
  AVESTAN = 'AVESTAN',
  AYMARA = 'AYMARA',
  AZERBAIJANI = 'AZERBAIJANI',
  BAMBARA = 'BAMBARA',
  BASHKIR = 'BASHKIR',
  BASQUE = 'BASQUE',
  BELARUSIAN = 'BELARUSIAN',
  BENGALI = 'BENGALI',
  BIHARI_LANGUAGES = 'BIHARI_LANGUAGES',
  BISLAMA = 'BISLAMA',
  BOSNIAN = 'BOSNIAN',
  BRETON = 'BRETON',
  BULGARIAN = 'BULGARIAN',
  BURMESE = 'BURMESE',
  CENTRAL_KHMER = 'CENTRAL_KHMER',
  CHAMORRO = 'CHAMORRO',
  CHECHEN = 'CHECHEN',
  CHICHEWA_CHEWA_NYANJA = 'CHICHEWA_CHEWA_NYANJA',
  CHINESE = 'CHINESE',
  CHURCH_SLAVONIC = 'CHURCH_SLAVONIC',
  CHUVASH = 'CHUVASH',
  CORNISH = 'CORNISH',
  CORSICAN = 'CORSICAN',
  CREE = 'CREE',
  CROATIAN = 'CROATIAN',
  CZECH = 'CZECH',
  DANISH = 'DANISH',
  DHIVEHI_MALDIVIAN = 'DHIVEHI_MALDIVIAN',
  DUTCH_FLEMISH = 'DUTCH_FLEMISH',
  DZONGKHA = 'DZONGKHA',
  ENGLISH = 'ENGLISH',
  ESPERANTO = 'ESPERANTO',
  ESTONIAN = 'ESTONIAN',
  EWE = 'EWE',
  FAROESE = 'FAROESE',
  FARSI = 'FARSI',
  FIJIAN = 'FIJIAN',
  FINNISH = 'FINNISH',
  FRENCH = 'FRENCH',
  FULAH = 'FULAH',
  GAELIC = 'GAELIC',
  GALICIAN = 'GALICIAN',
  GANDA = 'GANDA',
  GEORGIAN = 'GEORGIAN',
  GERMAN = 'GERMAN',
  GIKUYU = 'GIKUYU',
  GREEK = 'GREEK',
  GUARANI = 'GUARANI',
  GUJARATI = 'GUJARATI',
  HAITIAN_CREOLE = 'HAITIAN_CREOLE',
  HAUSA = 'HAUSA',
  HEBREW = 'HEBREW',
  HERERO = 'HERERO',
  HINDI = 'HINDI',
  HIRI_MOTU = 'HIRI_MOTU',
  HUNGARIAN = 'HUNGARIAN',
  ICELANDIC = 'ICELANDIC',
  IDO = 'IDO',
  IGBO = 'IGBO',
  INDONESIAN = 'INDONESIAN',
  INTERLINGUA = 'INTERLINGUA',
  INTERLINGUE_OCCIDENTAL = 'INTERLINGUE_OCCIDENTAL',
  INUKTITUT = 'INUKTITUT',
  INUPIAQ = 'INUPIAQ',
  IRISH = 'IRISH',
  ITALIAN = 'ITALIAN',
  JAPANESE = 'JAPANESE',
  JAVANESE = 'JAVANESE',
  KALAALLISUT_GREENLANDIC = 'KALAALLISUT_GREENLANDIC',
  KANNADA = 'KANNADA',
  KANURI = 'KANURI',
  KASHMIRI = 'KASHMIRI',
  KAZAKH = 'KAZAKH',
  KINYARWANDA = 'KINYARWANDA',
  KOMI = 'KOMI',
  KONGO = 'KONGO',
  KOREAN = 'KOREAN',
  KURDISH = 'KURDISH',
  KWANYAMA = 'KWANYAMA',
  KYRGYZ = 'KYRGYZ',
  LAO = 'LAO',
  LATIN = 'LATIN',
  LATVIAN = 'LATVIAN',
  LETZEBURGESCH = 'LETZEBURGESCH',
  LIMBURGISH = 'LIMBURGISH',
  LINGALA = 'LINGALA',
  LITHUANIAN = 'LITHUANIAN',
  LUBA_KATANGA = 'LUBA_KATANGA',
  MACEDONIAN = 'MACEDONIAN',
  MALAGASY = 'MALAGASY',
  MALAY = 'MALAY',
  MALAYALAM = 'MALAYALAM',
  MALTESE = 'MALTESE',
  MANX = 'MANX',
  MAORI = 'MAORI',
  MARATHI = 'MARATHI',
  MARSHALLESE = 'MARSHALLESE',
  MONGOLIAN = 'MONGOLIAN',
  NAURU = 'NAURU',
  NAVAJO = 'NAVAJO',
  NDONGA = 'NDONGA',
  NEPALI = 'NEPALI',
  NORTHERN_SAMI = 'NORTHERN_SAMI',
  NORTH_NDEBELE = 'NORTH_NDEBELE',
  NORWEGIAN = 'NORWEGIAN',
  NORWEGIAN_BOKMAL = 'NORWEGIAN_BOKMAL',
  NORWEGIAN_NYNORSK = 'NORWEGIAN_NYNORSK',
  NUOSU_SICHUAN_YI = 'NUOSU_SICHUAN_YI',
  OCCITAN = 'OCCITAN',
  OJIBWA = 'OJIBWA',
  ORIYA = 'ORIYA',
  OROMO = 'OROMO',
  OSSETIAN = 'OSSETIAN',
  PALI = 'PALI',
  PASHTO = 'PASHTO',
  POLISH = 'POLISH',
  PORTUGUESE = 'PORTUGUESE',
  PUNJABI = 'PUNJABI',
  QUECHUA = 'QUECHUA',
  ROMANIAN_MOLDOVAN = 'ROMANIAN_MOLDOVAN',
  ROMANSH = 'ROMANSH',
  RUNDI = 'RUNDI',
  RUSSIAN = 'RUSSIAN',
  SAMOAN = 'SAMOAN',
  SANGO = 'SANGO',
  SANSKRIT = 'SANSKRIT',
  SARDINIAN = 'SARDINIAN',
  SERBIAN = 'SERBIAN',
  SHONA = 'SHONA',
  SINDHI = 'SINDHI',
  SINHALA = 'SINHALA',
  SLOVAK = 'SLOVAK',
  SLOVENIAN = 'SLOVENIAN',
  SOMALI = 'SOMALI',
  SOTHO = 'SOTHO',
  SOUTH_NDEBELE = 'SOUTH_NDEBELE',
  SPANISH = 'SPANISH',
  SUNDANESE = 'SUNDANESE',
  SWAHILI = 'SWAHILI',
  SWATI = 'SWATI',
  SWEDISH = 'SWEDISH',
  TAGALOG = 'TAGALOG',
  TAHITIAN = 'TAHITIAN',
  TAJIK = 'TAJIK',
  TAMIL = 'TAMIL',
  TATAR = 'TATAR',
  TELUGU = 'TELUGU',
  THAI = 'THAI',
  TIBETAN = 'TIBETAN',
  TIGRINYA = 'TIGRINYA',
  TONGA = 'TONGA',
  TSONGA = 'TSONGA',
  TSWANA = 'TSWANA',
  TURKISH = 'TURKISH',
  TURKMEN = 'TURKMEN',
  TWI = 'TWI',
  UKRAINIAN = 'UKRAINIAN',
  URDU = 'URDU',
  UYGHUR = 'UYGHUR',
  UZBEK = 'UZBEK',
  VALENCIAN_CATALAN = 'VALENCIAN_CATALAN',
  VENDA = 'VENDA',
  VIETNAMESE = 'VIETNAMESE',
  VOLAPUK = 'VOLAPUK',
  WALLOON = 'WALLOON',
  WELSH = 'WELSH',
  WESTERN_FRISIAN = 'WESTERN_FRISIAN',
  WOLOF = 'WOLOF',
  XHOSA = 'XHOSA',
  YIDDISH = 'YIDDISH',
  YORUBA = 'YORUBA',
  ZHUANG = 'ZHUANG',
  ZULU = 'ZULU'
}

/**  Link Details  */
export type LinkDetails = {
  __typename?: 'LinkDetails';
  /**  The type of link  */
  type?: Maybe<LinkType>;
  /**  The url for the link  */
  url?: Maybe<Scalars['String']['output']>;
};

export enum LinkType {
  BANDCAMP = 'BANDCAMP',
  DISCORD = 'DISCORD',
  EMAIL = 'EMAIL',
  ETSY = 'ETSY',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  KO_FI = 'KO_FI',
  LINKTREE = 'LINKTREE',
  MASTODON = 'MASTODON',
  MERCH_STORE = 'MERCH_STORE',
  PATREON = 'PATREON',
  PINTEREST = 'PINTEREST',
  REDDIT = 'REDDIT',
  SNAPCHAT = 'SNAPCHAT',
  SOUNDCLOUD = 'SOUNDCLOUD',
  SPOTIFY = 'SPOTIFY',
  TELEGRAM = 'TELEGRAM',
  TIKTOK = 'TIKTOK',
  TUMBLR = 'TUMBLR',
  TWITCH = 'TWITCH',
  TWITTER = 'TWITTER',
  VIMEO = 'VIMEO',
  WEBSITE = 'WEBSITE',
  WECHAT = 'WECHAT',
  WHATSAPP = 'WHATSAPP',
  YOUTUBE = 'YOUTUBE'
}

/**  List Details  */
export type List = {
  __typename?: 'List';
  /**  The url for the banner image  */
  bannerImageUrl?: Maybe<Scalars['String']['output']>;
  /**  Comic series items in this list  */
  comicSeries?: Maybe<Array<Maybe<ComicSeries>>>;
  /**  Rating of the comic series  */
  contentRating?: Maybe<ContentRating>;
  /**  The date this list was created  */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /**  The description for a list  */
  description?: Maybe<Scalars['String']['output']>;
  /**  Genres for the comic series  */
  genres?: Maybe<Array<Maybe<Genre>>>;
  /**  Unique identifier for this list  */
  id: Scalars['ID']['output'];
  /**  The language the comic series is in  */
  language?: Maybe<Language>;
  /**  The name (title) for a list  */
  name?: Maybe<Scalars['String']['output']>;
  /**  A boolean indicating whether this list is private  */
  privacyType: PrivacyType;
  /**  Tags for the comic series  */
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /**  The type of this list  */
  type: ListType;
  /**  The user id of the user who created this list  */
  userId: Scalars['ID']['output'];
};

/**  The type of list  */
export enum ListType {
  /**  A list of comic issues  */
  COMICISSUES = 'COMICISSUES',
  /**  A list of comic series  */
  COMICSERIES = 'COMICSERIES',
  /**  A list of creators  */
  CREATORS = 'CREATORS'
}

export type Mutation = {
  __typename?: 'Mutation';
  /**  Report a comic series  */
  reportComicSeries?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationReportComicSeriesArgs = {
  reportType?: InputMaybe<Scalars['String']['input']>;
  uuid: Scalars['ID']['input'];
};

/**  The privacy types for a list  */
export enum PrivacyType {
  /**  The list is private  */
  PRIVATE = 'PRIVATE',
  /**  The list is public  */
  PUBLIC = 'PUBLIC'
}

export type Query = {
  __typename?: 'Query';
  /**  Get details on a comic issue */
  getComicIssue?: Maybe<ComicIssue>;
  /**  Get details on a Comic Series  */
  getComicSeries?: Maybe<ComicSeries>;
  /**  Get details on a comic story */
  getComicStory?: Maybe<ComicStory>;
  /**  Get details on a Creator  */
  getCreator?: Maybe<Creator>;
  /**  Get details on a Creator Content  */
  getCreatorContent?: Maybe<CreatorContent>;
  /**  Get efficient links for creators of content  */
  getCreatorLinksForSeries?: Maybe<Array<Maybe<CreatorLinkDetails>>>;
  /**  Get a list of curated lists  */
  getCuratedLists?: Maybe<HomeScreenCuratedList>;
  /**  Get documentation  */
  getDocumentation?: Maybe<Documentation>;
  /**  Get a list of featured comics  */
  getFeaturedComicSeries?: Maybe<HomeScreenComicSeries>;
  /**  Get multiple issues for a comic series  */
  getIssuesForComicSeries?: Maybe<ComicIssueForSeries>;
  /**  Get details on a List  */
  getList?: Maybe<List>;
  /**  Get a list of most popular comics  */
  getMostPopularComicSeries?: Maybe<HomeScreenComicSeries>;
  /**  Get a list of recently added comics  */
  getRecentlyAddedComicSeries?: Maybe<HomeScreenComicSeries>;
  /**  Get a list of recently updated comics  */
  getRecentlyUpdatedComicSeries?: Maybe<HomeScreenComicSeries>;
  /**  Search for a term  */
  search?: Maybe<SearchResults>;
};


export type QueryGetComicIssueArgs = {
  seriesUuid: Scalars['ID']['input'];
  uuid: Scalars['ID']['input'];
};


export type QueryGetComicSeriesArgs = {
  shortUrl?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetComicStoryArgs = {
  uuid?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetCreatorArgs = {
  shortUrl?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetCreatorContentArgs = {
  contentUuid?: InputMaybe<Scalars['ID']['input']>;
  creatorUuid?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryGetCreatorLinksForSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type QueryGetCuratedListsArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetDocumentationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetFeaturedComicSeriesArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetIssuesForComicSeriesArgs = {
  includeRemovedIssues?: InputMaybe<Scalars['Boolean']['input']>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  seriesUuid: Scalars['ID']['input'];
  sortOrder?: InputMaybe<SortOrder>;
};


export type QueryGetListArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetMostPopularComicSeriesArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetRecentlyAddedComicSeriesArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetRecentlyUpdatedComicSeriesArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySearchArgs = {
  filterForGenres?: InputMaybe<Array<InputMaybe<Genre>>>;
  filterForTags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  filterForTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};

/**  A search result  */
export type SearchResults = {
  __typename?: 'SearchResults';
  /**  A list of ComicSeries items  */
  comicSeries?: Maybe<Array<Maybe<ComicSeries>>>;
  /**  A list of Creator items  */
  creators?: Maybe<Array<Maybe<Creator>>>;
  /**  Identifier for the search query being sent  */
  searchId: Scalars['ID']['output'];
};

/**  Status of Series  */
export enum SeriesStatus {
  ANNOUNCED = 'ANNOUNCED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
  ONGOING = 'ONGOING',
  UNDER_REVISION = 'UNDER_REVISION'
}

/**  Different Sort orders  */
export enum SortOrder {
  LATEST = 'LATEST',
  OLDEST = 'OLDEST',
  SEARCH = 'SEARCH'
}

/**  Types of media available on Taddy  */
export enum TaddyType {
  COMICISSUE = 'COMICISSUE',
  COMICSERIES = 'COMICSERIES',
  CREATOR = 'CREATOR',
  CREATORCONTENT = 'CREATORCONTENT'
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ComicIssue: ResolverTypeWrapper<ComicIssueModel>;
  ComicIssueForSeries: ResolverTypeWrapper<Omit<ComicIssueForSeries, 'issues'> & { issues?: Maybe<Array<Maybe<ResolversTypes['ComicIssue']>>> }>;
  ComicSeries: ResolverTypeWrapper<ComicSeriesModel>;
  ComicSeriesLayoutType: ComicSeriesLayoutType;
  ComicSeriesType: ComicSeriesType;
  ComicStory: ResolverTypeWrapper<ComicStoryModel>;
  ContentRating: ContentRating;
  ContentRole: ContentRole;
  Country: Country;
  Creator: ResolverTypeWrapper<CreatorModel>;
  CreatorContent: ResolverTypeWrapper<CreatorContentModel>;
  CreatorLinkDetails: ResolverTypeWrapper<CreatorLinkDetails>;
  Documentation: ResolverTypeWrapper<Documentation>;
  Genre: Genre;
  HomeScreenComicSeries: ResolverTypeWrapper<Omit<HomeScreenComicSeries, 'comicSeries'> & { comicSeries?: Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>> }>;
  HomeScreenCuratedList: ResolverTypeWrapper<Omit<HomeScreenCuratedList, 'lists'> & { lists?: Maybe<Array<Maybe<ResolversTypes['List']>>> }>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Language: Language;
  LinkDetails: ResolverTypeWrapper<LinkDetails>;
  LinkType: LinkType;
  List: ResolverTypeWrapper<ListModel>;
  ListType: ListType;
  Mutation: ResolverTypeWrapper<{}>;
  PrivacyType: PrivacyType;
  Query: ResolverTypeWrapper<{}>;
  SearchResults: ResolverTypeWrapper<Omit<SearchResults, 'comicSeries' | 'creators'> & { comicSeries?: Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>>, creators?: Maybe<Array<Maybe<ResolversTypes['Creator']>>> }>;
  SeriesStatus: SeriesStatus;
  SortOrder: SortOrder;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  TaddyType: TaddyType;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  ComicIssue: ComicIssueModel;
  ComicIssueForSeries: Omit<ComicIssueForSeries, 'issues'> & { issues?: Maybe<Array<Maybe<ResolversParentTypes['ComicIssue']>>> };
  ComicSeries: ComicSeriesModel;
  ComicStory: ComicStoryModel;
  Creator: CreatorModel;
  CreatorContent: CreatorContentModel;
  CreatorLinkDetails: CreatorLinkDetails;
  Documentation: Documentation;
  HomeScreenComicSeries: Omit<HomeScreenComicSeries, 'comicSeries'> & { comicSeries?: Maybe<Array<Maybe<ResolversParentTypes['ComicSeries']>>> };
  HomeScreenCuratedList: Omit<HomeScreenCuratedList, 'lists'> & { lists?: Maybe<Array<Maybe<ResolversParentTypes['List']>>> };
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  LinkDetails: LinkDetails;
  List: ListModel;
  Mutation: {};
  Query: {};
  SearchResults: Omit<SearchResults, 'comicSeries' | 'creators'> & { comicSeries?: Maybe<Array<Maybe<ResolversParentTypes['ComicSeries']>>>, creators?: Maybe<Array<Maybe<ResolversParentTypes['Creator']>>> };
  String: Scalars['String']['output'];
}>;

export type ComicIssueResolvers<ContextType = any, ParentType extends ResolversParentTypes['ComicIssue'] = ResolversParentTypes['ComicIssue']> = ResolversObject<{
  bannerImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  comicSeries?: Resolver<Maybe<ResolversTypes['ComicSeries']>, ParentType, ContextType>;
  creatorNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dateExclusiveContentAvailable?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isBlocked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isRemoved?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nextIssue?: Resolver<Maybe<ResolversTypes['ComicIssue']>, ParentType, ContextType>;
  position?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  previewStoryImageUrls?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  scopesForExclusiveContent?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  seriesUuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  stories?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicStory']>>>, ParentType, ContextType>;
  storiesHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  thumbnailImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ComicIssueForSeriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ComicIssueForSeries'] = ResolversParentTypes['ComicIssueForSeries']> = ResolversObject<{
  issues?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicIssue']>>>, ParentType, ContextType>;
  seriesUuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ComicSeriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ComicSeries'] = ResolversParentTypes['ComicSeries']> = ResolversObject<{
  bannerImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contentRating?: Resolver<Maybe<ResolversTypes['ContentRating']>, ParentType, ContextType>;
  copyright?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  coverImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creators?: Resolver<Maybe<Array<Maybe<ResolversTypes['Creator']>>>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  genre0?: Resolver<Maybe<ResolversTypes['Genre']>, ParentType, ContextType>;
  genre1?: Resolver<Maybe<ResolversTypes['Genre']>, ParentType, ContextType>;
  genre2?: Resolver<Maybe<ResolversTypes['Genre']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostingProviderUuid?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isBlocked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isCompleted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  issueCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  issuesHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['Language']>, ParentType, ContextType>;
  layoutType?: Resolver<Maybe<ResolversTypes['ComicSeriesLayoutType']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scopesForExclusiveContent?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  seriesType?: Resolver<Maybe<ResolversTypes['ComicSeriesType']>, ParentType, ContextType>;
  shortUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssOwnerName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssOwnerPublicEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['SeriesStatus']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  thumbnailImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ComicStoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['ComicStory'] = ResolversParentTypes['ComicStory']> = ResolversObject<{
  comicIssue?: Resolver<Maybe<ResolversTypes['ComicIssue']>, ParentType, ContextType>;
  comicSeries?: Resolver<Maybe<ResolversTypes['ComicSeries']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  isRemoved?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  issueUuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  seriesUuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  storyImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreatorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Creator'] = ResolversParentTypes['Creator']> = ResolversObject<{
  avatarImageAsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  comics?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>>, ParentType, ContextType>;
  content?: Resolver<Maybe<Array<Maybe<ResolversTypes['CreatorContent']>>>, ParentType, ContextType, Partial<CreatorContentArgs>>;
  contentHash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  copyright?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes['Country']>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isBlocked?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['LinkDetails']>>>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shortUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssOwnerName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssOwnerPublicEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sssUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  uuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreatorContentResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreatorContent'] = ResolversParentTypes['CreatorContent']> = ResolversObject<{
  comicseries?: Resolver<Maybe<ResolversTypes['ComicSeries']>, ParentType, ContextType>;
  contentPosition?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  contentType?: Resolver<Maybe<ResolversTypes['TaddyType']>, ParentType, ContextType>;
  contentUuid?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  creatorUuid?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  position?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  roles?: Resolver<Maybe<Array<Maybe<ResolversTypes['ContentRole']>>>, ParentType, ContextType>;
  uuid?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CreatorLinkDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreatorLinkDetails'] = ResolversParentTypes['CreatorLinkDetails']> = ResolversObject<{
  creatorUuid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['LinkType']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DocumentationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Documentation'] = ResolversParentTypes['Documentation']> = ResolversObject<{
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HomeScreenComicSeriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['HomeScreenComicSeries'] = ResolversParentTypes['HomeScreenComicSeries']> = ResolversObject<{
  comicSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type HomeScreenCuratedListResolvers<ContextType = any, ParentType extends ResolversParentTypes['HomeScreenCuratedList'] = ResolversParentTypes['HomeScreenCuratedList']> = ResolversObject<{
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  lists?: Resolver<Maybe<Array<Maybe<ResolversTypes['List']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LinkDetailsResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkDetails'] = ResolversParentTypes['LinkDetails']> = ResolversObject<{
  type?: Resolver<Maybe<ResolversTypes['LinkType']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ListResolvers<ContextType = any, ParentType extends ResolversParentTypes['List'] = ResolversParentTypes['List']> = ResolversObject<{
  bannerImageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  comicSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>>, ParentType, ContextType>;
  contentRating?: Resolver<Maybe<ResolversTypes['ContentRating']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  genres?: Resolver<Maybe<Array<Maybe<ResolversTypes['Genre']>>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['Language']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  privacyType?: Resolver<ResolversTypes['PrivacyType'], ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ListType'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  reportComicSeries?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationReportComicSeriesArgs, 'uuid'>>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getComicIssue?: Resolver<Maybe<ResolversTypes['ComicIssue']>, ParentType, ContextType, RequireFields<QueryGetComicIssueArgs, 'seriesUuid' | 'uuid'>>;
  getComicSeries?: Resolver<Maybe<ResolversTypes['ComicSeries']>, ParentType, ContextType, Partial<QueryGetComicSeriesArgs>>;
  getComicStory?: Resolver<Maybe<ResolversTypes['ComicStory']>, ParentType, ContextType, Partial<QueryGetComicStoryArgs>>;
  getCreator?: Resolver<Maybe<ResolversTypes['Creator']>, ParentType, ContextType, Partial<QueryGetCreatorArgs>>;
  getCreatorContent?: Resolver<Maybe<ResolversTypes['CreatorContent']>, ParentType, ContextType, Partial<QueryGetCreatorContentArgs>>;
  getCreatorLinksForSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['CreatorLinkDetails']>>>, ParentType, ContextType, RequireFields<QueryGetCreatorLinksForSeriesArgs, 'seriesUuid'>>;
  getCuratedLists?: Resolver<Maybe<ResolversTypes['HomeScreenCuratedList']>, ParentType, ContextType, Partial<QueryGetCuratedListsArgs>>;
  getDocumentation?: Resolver<Maybe<ResolversTypes['Documentation']>, ParentType, ContextType, RequireFields<QueryGetDocumentationArgs, 'id'>>;
  getFeaturedComicSeries?: Resolver<Maybe<ResolversTypes['HomeScreenComicSeries']>, ParentType, ContextType, Partial<QueryGetFeaturedComicSeriesArgs>>;
  getIssuesForComicSeries?: Resolver<Maybe<ResolversTypes['ComicIssueForSeries']>, ParentType, ContextType, RequireFields<QueryGetIssuesForComicSeriesArgs, 'seriesUuid'>>;
  getList?: Resolver<Maybe<ResolversTypes['List']>, ParentType, ContextType, RequireFields<QueryGetListArgs, 'id'>>;
  getMostPopularComicSeries?: Resolver<Maybe<ResolversTypes['HomeScreenComicSeries']>, ParentType, ContextType, Partial<QueryGetMostPopularComicSeriesArgs>>;
  getRecentlyAddedComicSeries?: Resolver<Maybe<ResolversTypes['HomeScreenComicSeries']>, ParentType, ContextType, Partial<QueryGetRecentlyAddedComicSeriesArgs>>;
  getRecentlyUpdatedComicSeries?: Resolver<Maybe<ResolversTypes['HomeScreenComicSeries']>, ParentType, ContextType, Partial<QueryGetRecentlyUpdatedComicSeriesArgs>>;
  search?: Resolver<Maybe<ResolversTypes['SearchResults']>, ParentType, ContextType, Partial<QuerySearchArgs>>;
}>;

export type SearchResultsResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchResults'] = ResolversParentTypes['SearchResults']> = ResolversObject<{
  comicSeries?: Resolver<Maybe<Array<Maybe<ResolversTypes['ComicSeries']>>>, ParentType, ContextType>;
  creators?: Resolver<Maybe<Array<Maybe<ResolversTypes['Creator']>>>, ParentType, ContextType>;
  searchId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ComicIssue?: ComicIssueResolvers<ContextType>;
  ComicIssueForSeries?: ComicIssueForSeriesResolvers<ContextType>;
  ComicSeries?: ComicSeriesResolvers<ContextType>;
  ComicStory?: ComicStoryResolvers<ContextType>;
  Creator?: CreatorResolvers<ContextType>;
  CreatorContent?: CreatorContentResolvers<ContextType>;
  CreatorLinkDetails?: CreatorLinkDetailsResolvers<ContextType>;
  Documentation?: DocumentationResolvers<ContextType>;
  HomeScreenComicSeries?: HomeScreenComicSeriesResolvers<ContextType>;
  HomeScreenCuratedList?: HomeScreenCuratedListResolvers<ContextType>;
  LinkDetails?: LinkDetailsResolvers<ContextType>;
  List?: ListResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SearchResults?: SearchResultsResolvers<ContextType>;
}>;

