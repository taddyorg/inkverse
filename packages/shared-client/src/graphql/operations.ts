import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** Authentication provider types */
export enum AuthProvider {
  APPLE = 'APPLE',
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE'
}

/** Bluesky profile information */
export type BlueskyProfile = {
  __typename?: 'BlueskyProfile';
  avatar?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  did: Scalars['ID']['output'];
  displayName?: Maybe<Scalars['String']['output']>;
  handle: Scalars['String']['output'];
};

/** Canny SSO redirect response */
export type CannySso = {
  __typename?: 'CannySSO';
  redirectUrl: Scalars['String']['output'];
  ssoToken: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
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
  /**  Previous issue in the series  */
  previousIssue?: Maybe<ComicIssue>;
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

/** Public stats for a comic issue (like count, future: comment count) */
export type ComicIssueStats = {
  __typename?: 'ComicIssueStats';
  issueUuid: Scalars['ID']['output'];
  likeCount?: Maybe<Scalars['Int']['output']>;
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

/** Public comment data (no auth required) */
export type Comment = {
  __typename?: 'Comment';
  createdAt: Scalars['Int']['output'];
  replyToUuid?: Maybe<Scalars['ID']['output']>;
  stats?: Maybe<CommentStats>;
  targetType: InkverseType;
  targetUuid: Scalars['ID']['output'];
  text: Scalars['String']['output'];
  user?: Maybe<User>;
  uuid: Scalars['ID']['output'];
};

/** Sort type for comments */
export enum CommentSortType {
  NEWEST = 'NEWEST',
  TOP = 'TOP'
}

/** Stats for a comment (like count, reply count) */
export type CommentStats = {
  __typename?: 'CommentStats';
  likeCount?: Maybe<Scalars['Int']['output']>;
  replyCount?: Maybe<Scalars['Int']['output']>;
  uuid: Scalars['ID']['output'];
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

/**  Types of media available on Inkverse  */
export enum InkverseType {
  COMICISSUE = 'COMICISSUE',
  COMICSERIES = 'COMICSERIES',
  COMICSTORY = 'COMICSTORY',
  COMMENT = 'COMMENT',
  CREATOR = 'CREATOR',
  CREATORCONTENT = 'CREATORCONTENT',
  LIST = 'LIST',
  USER = 'USER'
}

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
  BLUESKY = 'BLUESKY',
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
  /** Add a new comment or reply to a comic issue */
  addComment?: Maybe<Comment>;
  /** Delete a comment permanently */
  deleteComment: Scalars['Boolean']['output'];
  /** Disable notifications for a comic series */
  disableNotificationsForSeries: UserComicSeries;
  /** Edit an existing comment */
  editComment?: Maybe<Comment>;
  /** Enable notifications for a comic series */
  enableNotificationsForSeries: UserComicSeries;
  /** Fetch all hosting provider tokens for the user */
  fetchAllHostingProviderTokens?: Maybe<Array<Scalars['String']['output']>>;
  /** Fetch user's OAuth tokens for a specific hosting provider */
  fetchRefreshTokenForHostingProvider?: Maybe<Scalars['String']['output']>;
  /** Like a comic issue */
  likeComicIssue: UserComicSeries;
  /** Like a comment */
  likeComment?: Maybe<UserComment>;
  /**  Report a comic series  */
  reportComicSeries?: Maybe<Scalars['Boolean']['output']>;
  /** Report a comment */
  reportComment: Scalars['Boolean']['output'];
  /** Resend verification email */
  resendVerificationEmail: Scalars['Boolean']['output'];
  /** Save or update the user's Bluesky handle */
  saveBlueskyDid?: Maybe<User>;
  /** Save a push notification token for the user's device */
  savePushToken: Scalars['Boolean']['output'];
  /** Set comment visibility (soft delete/restore) */
  setCommentVisibility?: Maybe<Comment>;
  /** Subscribe to multiple comic series */
  subscribeToMultipleComicSeries: Scalars['Boolean']['output'];
  /** Subscribe to a comic series */
  subscribeToSeries: UserComicSeries;
  /** Super-like all episodes in a series (creates individual like records) */
  superLikeAllEpisodes: UserComicSeries;
  /** Unlike a comic issue */
  unlikeComicIssue: UserComicSeries;
  /** Unlike a comment */
  unlikeComment?: Maybe<UserComment>;
  /** Unsubscribe from a comic series */
  unsubscribeFromSeries: UserComicSeries;
  /** Update user email */
  updateUserEmail?: Maybe<User>;
  /** Update user profile (username and age) */
  updateUserProfile?: Maybe<User>;
};


export type MutationAddCommentArgs = {
  issueUuid: Scalars['ID']['input'];
  replyToCommentUuid?: InputMaybe<Scalars['ID']['input']>;
  seriesUuid: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationDeleteCommentArgs = {
  commentUuid: Scalars['ID']['input'];
};


export type MutationDisableNotificationsForSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type MutationEditCommentArgs = {
  commentUuid: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};


export type MutationEnableNotificationsForSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type MutationFetchRefreshTokenForHostingProviderArgs = {
  hostingProviderUuid: Scalars['String']['input'];
};


export type MutationLikeComicIssueArgs = {
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
};


export type MutationLikeCommentArgs = {
  commentUuid: Scalars['ID']['input'];
  issueUuid: Scalars['ID']['input'];
};


export type MutationReportComicSeriesArgs = {
  reportType: ReportType;
  uuid: Scalars['ID']['input'];
};


export type MutationReportCommentArgs = {
  additionalInfo?: InputMaybe<Scalars['String']['input']>;
  commentUuid: Scalars['ID']['input'];
  reportType: ReportType;
};


export type MutationSaveBlueskyDidArgs = {
  did: Scalars['String']['input'];
};


export type MutationSavePushTokenArgs = {
  fcmToken: Scalars['String']['input'];
  platform: Scalars['String']['input'];
};


export type MutationSetCommentVisibilityArgs = {
  commentUuid: Scalars['ID']['input'];
  isVisible: Scalars['Boolean']['input'];
};


export type MutationSubscribeToMultipleComicSeriesArgs = {
  seriesUuids: Array<Scalars['ID']['input']>;
};


export type MutationSubscribeToSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type MutationSuperLikeAllEpisodesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type MutationUnlikeComicIssueArgs = {
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
};


export type MutationUnlikeCommentArgs = {
  commentUuid: Scalars['ID']['input'];
  issueUuid: Scalars['ID']['input'];
};


export type MutationUnsubscribeFromSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type MutationUpdateUserEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationUpdateUserProfileArgs = {
  ageRange?: InputMaybe<UserAgeRange>;
  birthYear?: InputMaybe<Scalars['Int']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

/** User's preference for a specific notification type */
export type NotificationPreference = {
  __typename?: 'NotificationPreference';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  notificationType: NotificationType;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  userId: Scalars['ID']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

/** Input for updating notification preferences */
export type NotificationPreferenceInput = {
  notificationType: NotificationType;
};

/** Types of notifications users can receive */
export enum NotificationType {
  NEW_EPISODE_RELEASED = 'NEW_EPISODE_RELEASED'
}

/**  The privacy types for a list  */
export enum PrivacyType {
  /**  The list is private  */
  PRIVATE = 'PRIVATE',
  /**  The list is public  */
  PUBLIC = 'PUBLIC'
}

/** Profile comic series wrapper for caching */
export type ProfileComicSeries = {
  __typename?: 'ProfileComicSeries';
  /** List of comic series */
  comicSeries?: Maybe<Array<Maybe<ComicSeries>>>;
  /** Id of the user */
  userId: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Generate Canny SSO redirect URL for the current user */
  cannySso?: Maybe<CannySso>;
  /** Get Bluesky profile details for a given handle */
  getBlueskyProfile?: Maybe<BlueskyProfile>;
  /**  Get details on a comic issue */
  getComicIssue?: Maybe<ComicIssue>;
  /**  Get details on a Comic Series  */
  getComicSeries?: Maybe<ComicSeries>;
  /**  Get details on a comic story */
  getComicStory?: Maybe<ComicStory>;
  /** Get all comics from Bluesky creators */
  getComicsFromBlueskyCreators?: Maybe<Array<Maybe<ComicSeries>>>;
  /** Get all comics from Patreon creators */
  getComicsFromPatreonCreators?: Maybe<Array<Maybe<ComicSeries>>>;
  /** Get paginated comments for a target (e.g., comic issue) */
  getComments: Array<Comment>;
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
  /** Get replies for a specific comment */
  getRepliesForComment: Array<Comment>;
  /** Get stats (like count) for a single episode */
  getStatsForComicIssue?: Maybe<ComicIssueStats>;
  /** Get stats (like counts) for all episodes in a series */
  getStatsForComicSeries?: Maybe<Array<ComicIssueStats>>;
  /** Get a user by their ID */
  getUserById?: Maybe<User>;
  /** Get a user by their username */
  getUserByUsername?: Maybe<User>;
  /** Get user's relationship data for a specific comic series */
  getUserComicSeries?: Maybe<UserComicSeries>;
  /** Get user's comment data for a target (liked comments, etc.) */
  getUserComments?: Maybe<UserComment>;
  /** Get the current user's subscribed comics */
  getUserSubscribedComics?: Maybe<ProfileComicSeries>;
  /** Get the current authenticated user */
  me?: Maybe<User>;
  /**  Search for a term  */
  search?: Maybe<SearchResults>;
};


export type QueryCannySsoArgs = {
  redirectPath?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetBlueskyProfileArgs = {
  handle: Scalars['String']['input'];
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


export type QueryGetCommentsArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<CommentSortType>;
  targetType: InkverseType;
  targetUuid: Scalars['ID']['input'];
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


export type QueryGetRepliesForCommentArgs = {
  commentUuid: Scalars['ID']['input'];
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  targetType: InkverseType;
  targetUuid: Scalars['ID']['input'];
};


export type QueryGetStatsForComicIssueArgs = {
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
};


export type QueryGetStatsForComicSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type QueryGetUserByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserByUsernameArgs = {
  username: Scalars['String']['input'];
};


export type QueryGetUserComicSeriesArgs = {
  seriesUuid: Scalars['ID']['input'];
};


export type QueryGetUserCommentsArgs = {
  targetType: InkverseType;
  targetUuid: Scalars['ID']['input'];
};


export type QueryGetUserSubscribedComicsArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


export type QuerySearchArgs = {
  filterForGenres?: InputMaybe<Array<InputMaybe<Genre>>>;
  filterForTags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  filterForTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  term?: InputMaybe<Scalars['String']['input']>;
};

/** Report type for reporting content */
export enum ReportType {
  COMICSERIES_CONTAINS_HATE_SPEECH = 'COMICSERIES_CONTAINS_HATE_SPEECH',
  COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT = 'COMICSERIES_CONTAINS_SEXUALLY_EXPLICIT_CONTENT',
  COMICSERIES_CONTAINS_UNLAWFUL_CONTENT = 'COMICSERIES_CONTAINS_UNLAWFUL_CONTENT',
  COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT = 'COMICSERIES_DECEPTIVE_OR_FRAUDULENT_CONTENT',
  COMICSERIES_GENERATIVE_AI_CONTENT = 'COMICSERIES_GENERATIVE_AI_CONTENT',
  COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION = 'COMICSERIES_INTELLECTUAL_PROPERTY_VIOLATION',
  COMICSERIES_IS_SPAM = 'COMICSERIES_IS_SPAM',
  COMMENT_HARASSMENT = 'COMMENT_HARASSMENT',
  COMMENT_MEAN_OR_RUDE = 'COMMENT_MEAN_OR_RUDE',
  COMMENT_SPAM = 'COMMENT_SPAM',
  COMMENT_SPOILER = 'COMMENT_SPOILER'
}

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

/** User Type */
export type User = {
  __typename?: 'User';
  ageRange?: Maybe<UserAgeRange>;
  birthYear?: Maybe<Scalars['Int']['output']>;
  blueskyDid?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isEmailVerified?: Maybe<Scalars['Boolean']['output']>;
  subscriptions?: Maybe<Array<Maybe<ComicSeries>>>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};


/** User Type */
export type UserSubscriptionsArgs = {
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

/** Age range buckets for users */
export enum UserAgeRange {
  AGE_18_24 = 'AGE_18_24',
  AGE_25_34 = 'AGE_25_34',
  AGE_35_PLUS = 'AGE_35_PLUS',
  UNDER_18 = 'UNDER_18'
}

/** User's relationship with a comic series, including subscription status and reading progress */
export type UserComicSeries = {
  __typename?: 'UserComicSeries';
  hasNotificationEnabled: Scalars['Boolean']['output'];
  isRecommended: Scalars['Boolean']['output'];
  isSubscribed: Scalars['Boolean']['output'];
  likedComicIssueUuids: Array<Maybe<Scalars['String']['output']>>;
  seriesUuid: Scalars['ID']['output'];
};

/** User-specific comment data (auth required) */
export type UserComment = {
  __typename?: 'UserComment';
  likedCommentUuids: Array<Maybe<Scalars['String']['output']>>;
  targetType: InkverseType;
  targetUuid: Scalars['ID']['output'];
};

export type ComicIssueDetailsFragment = { __typename?: 'ComicIssue', bannerImageAsString?: string | null, creatorNote?: string | null, uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null, stories?: Array<{ __typename?: 'ComicStory', uuid: string, issueUuid: string, seriesUuid: string, storyImageAsString?: string | null, width?: number | null, height?: number | null } | null> | null, previousIssue?: { __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null } | null, nextIssue?: { __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null } | null };

export type ComicSeriesDetailsFragment = { __typename?: 'ComicSeries', uuid: string, name?: string | null, description?: string | null, datePublished?: number | null, hash?: string | null, issuesHash?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, tags?: Array<string | null> | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null, language?: Language | null, status?: SeriesStatus | null, contentRating?: ContentRating | null, seriesType?: ComicSeriesType | null, isCompleted?: boolean | null, issueCount?: number | null, hostingProviderUuid?: string | null };

export type CommentDetailsFragment = { __typename?: 'Comment', uuid: string, text: string, createdAt: number, targetUuid: string, targetType: InkverseType, replyToUuid?: string | null, user?: { __typename?: 'User', id: string, username?: string | null } | null, stats?: { __typename?: 'CommentStats', uuid: string, likeCount?: number | null, replyCount?: number | null } | null };

export type CreatorDetailsFragment = { __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, bio?: string | null, avatarImageAsString?: string | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null };

export type ListDetailsFragment = { __typename?: 'List', id: string, name?: string | null, description?: string | null, bannerImageUrl?: string | null, type: ListType, privacyType: PrivacyType, userId: string, comicSeries?: Array<{ __typename?: 'ComicSeries', description?: string | null, uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null };

export type MiniComicIssueDetailsFragment = { __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null };

export type MiniComicSeriesDetailsFragment = { __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null };

export type MiniCreatorDetailsFragment = { __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, avatarImageAsString?: string | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null };

export type MiniUserDetailsFragment = { __typename?: 'User', id: string, username?: string | null };

export type UserComicSeriesDetailsFragment = { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> };

export type UserCommentDetailsFragment = { __typename?: 'UserComment', targetUuid: string, targetType: InkverseType, likedCommentUuids: Array<string | null> };

export type UserDetailsFragment = { __typename?: 'User', id: string, username?: string | null, email?: string | null, isEmailVerified?: boolean | null, ageRange?: UserAgeRange | null, birthYear?: number | null, blueskyDid?: string | null };

export type AddCommentMutationVariables = Exact<{
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
  text: Scalars['String']['input'];
  replyToCommentUuid?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AddCommentMutation = { __typename?: 'Mutation', addComment?: { __typename?: 'Comment', uuid: string, text: string, createdAt: number, targetUuid: string, targetType: InkverseType, replyToUuid?: string | null, user?: { __typename?: 'User', id: string, username?: string | null } | null, stats?: { __typename?: 'CommentStats', uuid: string, likeCount?: number | null, replyCount?: number | null } | null } | null };

export type DeleteCommentMutationVariables = Exact<{
  commentUuid: Scalars['ID']['input'];
}>;


export type DeleteCommentMutation = { __typename?: 'Mutation', deleteComment: boolean };

export type DisableNotificationsForSeriesMutationVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type DisableNotificationsForSeriesMutation = { __typename?: 'Mutation', disableNotificationsForSeries: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type EditCommentMutationVariables = Exact<{
  commentUuid: Scalars['ID']['input'];
  text: Scalars['String']['input'];
}>;


export type EditCommentMutation = { __typename?: 'Mutation', editComment?: { __typename?: 'Comment', uuid: string, text: string, createdAt: number, targetUuid: string, targetType: InkverseType, replyToUuid?: string | null, user?: { __typename?: 'User', id: string, username?: string | null } | null, stats?: { __typename?: 'CommentStats', uuid: string, likeCount?: number | null, replyCount?: number | null } | null } | null };

export type EnableNotificationsForSeriesMutationVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type EnableNotificationsForSeriesMutation = { __typename?: 'Mutation', enableNotificationsForSeries: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type FetchAllHostingProviderTokensMutationVariables = Exact<{ [key: string]: never; }>;


export type FetchAllHostingProviderTokensMutation = { __typename?: 'Mutation', fetchAllHostingProviderTokens?: Array<string> | null };

export type FetchRefreshTokenForHostingProviderMutationVariables = Exact<{
  hostingProviderUuid: Scalars['String']['input'];
}>;


export type FetchRefreshTokenForHostingProviderMutation = { __typename?: 'Mutation', fetchRefreshTokenForHostingProvider?: string | null };

export type LikeComicIssueMutationVariables = Exact<{
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
}>;


export type LikeComicIssueMutation = { __typename?: 'Mutation', likeComicIssue: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type LikeCommentMutationVariables = Exact<{
  commentUuid: Scalars['ID']['input'];
  issueUuid: Scalars['ID']['input'];
}>;


export type LikeCommentMutation = { __typename?: 'Mutation', likeComment?: { __typename?: 'UserComment', targetUuid: string, targetType: InkverseType, likedCommentUuids: Array<string | null> } | null };

export type ReportComicSeriesMutationVariables = Exact<{
  uuid: Scalars['ID']['input'];
  reportType: ReportType;
}>;


export type ReportComicSeriesMutation = { __typename?: 'Mutation', reportComicSeries?: boolean | null };

export type ReportCommentMutationVariables = Exact<{
  commentUuid: Scalars['ID']['input'];
  reportType: ReportType;
  additionalInfo?: InputMaybe<Scalars['String']['input']>;
}>;


export type ReportCommentMutation = { __typename?: 'Mutation', reportComment: boolean };

export type ResendVerificationEmailMutationVariables = Exact<{ [key: string]: never; }>;


export type ResendVerificationEmailMutation = { __typename?: 'Mutation', resendVerificationEmail: boolean };

export type SaveBlueskyDidMutationVariables = Exact<{
  did: Scalars['String']['input'];
}>;


export type SaveBlueskyDidMutation = { __typename?: 'Mutation', saveBlueskyDid?: { __typename?: 'User', id: string, blueskyDid?: string | null } | null };

export type SavePushTokenMutationVariables = Exact<{
  fcmToken: Scalars['String']['input'];
  platform: Scalars['String']['input'];
}>;


export type SavePushTokenMutation = { __typename?: 'Mutation', savePushToken: boolean };

export type SubscribeToMultipleComicSeriesMutationVariables = Exact<{
  seriesUuids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type SubscribeToMultipleComicSeriesMutation = { __typename?: 'Mutation', subscribeToMultipleComicSeries: boolean };

export type SubscribeToSeriesMutationVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type SubscribeToSeriesMutation = { __typename?: 'Mutation', subscribeToSeries: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type SuperLikeAllEpisodesMutationVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type SuperLikeAllEpisodesMutation = { __typename?: 'Mutation', superLikeAllEpisodes: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type UnlikeComicIssueMutationVariables = Exact<{
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
}>;


export type UnlikeComicIssueMutation = { __typename?: 'Mutation', unlikeComicIssue: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type UnlikeCommentMutationVariables = Exact<{
  commentUuid: Scalars['ID']['input'];
  issueUuid: Scalars['ID']['input'];
}>;


export type UnlikeCommentMutation = { __typename?: 'Mutation', unlikeComment?: { __typename?: 'UserComment', targetUuid: string, targetType: InkverseType, likedCommentUuids: Array<string | null> } | null };

export type UnsubscribeFromSeriesMutationVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type UnsubscribeFromSeriesMutation = { __typename?: 'Mutation', unsubscribeFromSeries: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } };

export type UpdateUserEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type UpdateUserEmailMutation = { __typename?: 'Mutation', updateUserEmail?: { __typename?: 'User', id: string, username?: string | null, email?: string | null, isEmailVerified?: boolean | null, ageRange?: UserAgeRange | null, birthYear?: number | null, blueskyDid?: string | null } | null };

export type UpdateUserProfileMutationVariables = Exact<{
  username?: InputMaybe<Scalars['String']['input']>;
  ageRange?: InputMaybe<UserAgeRange>;
  birthYear?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpdateUserProfileMutation = { __typename?: 'Mutation', updateUserProfile?: { __typename?: 'User', id: string, username?: string | null, email?: string | null, isEmailVerified?: boolean | null, ageRange?: UserAgeRange | null, birthYear?: number | null, blueskyDid?: string | null } | null };

export type CannySsoQueryVariables = Exact<{
  redirectPath?: InputMaybe<Scalars['String']['input']>;
}>;


export type CannySsoQuery = { __typename?: 'Query', cannySso?: { __typename?: 'CannySSO', userId: string, ssoToken: string, redirectUrl: string } | null };

export type GetBlueskyProfileQueryVariables = Exact<{
  handle: Scalars['String']['input'];
}>;


export type GetBlueskyProfileQuery = { __typename?: 'Query', getBlueskyProfile?: { __typename?: 'BlueskyProfile', did: string, handle: string, displayName?: string | null, avatar?: string | null, description?: string | null } | null };

export type GetComicIssueStatsQueryVariables = Exact<{
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
}>;


export type GetComicIssueStatsQuery = { __typename?: 'Query', getStatsForComicIssue?: { __typename?: 'ComicIssueStats', seriesUuid: string, issueUuid: string, likeCount?: number | null } | null };

export type GetComicSeriesStatsQueryVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type GetComicSeriesStatsQuery = { __typename?: 'Query', getStatsForComicSeries?: Array<{ __typename?: 'ComicIssueStats', seriesUuid: string, issueUuid: string, likeCount?: number | null }> | null };

export type GetComicIssueQueryVariables = Exact<{
  issueUuid: Scalars['ID']['input'];
  seriesUuid: Scalars['ID']['input'];
}>;


export type GetComicIssueQuery = { __typename?: 'Query', getComicIssue?: { __typename?: 'ComicIssue', bannerImageAsString?: string | null, creatorNote?: string | null, uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null, stories?: Array<{ __typename?: 'ComicStory', uuid: string, issueUuid: string, seriesUuid: string, storyImageAsString?: string | null, width?: number | null, height?: number | null } | null> | null, previousIssue?: { __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null } | null, nextIssue?: { __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null } | null } | null, getComicSeries?: { __typename?: 'ComicSeries', uuid: string, name?: string | null, description?: string | null, datePublished?: number | null, hash?: string | null, issuesHash?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, tags?: Array<string | null> | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null, language?: Language | null, status?: SeriesStatus | null, contentRating?: ContentRating | null, seriesType?: ComicSeriesType | null, isCompleted?: boolean | null, issueCount?: number | null, hostingProviderUuid?: string | null, creators?: Array<{ __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, avatarImageAsString?: string | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null } | null> | null } | null, getCreatorLinksForSeries?: Array<{ __typename?: 'CreatorLinkDetails', creatorUuid: string, type?: LinkType | null, url?: string | null } | null> | null, getStatsForComicIssue?: { __typename?: 'ComicIssueStats', seriesUuid: string, issueUuid: string, likeCount?: number | null } | null };

export type GetComicsFromBlueskyCreatorsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetComicsFromBlueskyCreatorsQuery = { __typename?: 'Query', getComicsFromBlueskyCreators?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null };

export type GetComicsFromPatreonCreatorsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetComicsFromPatreonCreatorsQuery = { __typename?: 'Query', getComicsFromPatreonCreators?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null };

export type GetComicSeriesQueryVariables = Exact<{
  uuid: Scalars['ID']['input'];
  sortOrderForIssues?: InputMaybe<SortOrder>;
  limitPerPageForIssues?: InputMaybe<Scalars['Int']['input']>;
  pageForIssues?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetComicSeriesQuery = { __typename?: 'Query', getComicSeries?: { __typename?: 'ComicSeries', uuid: string, name?: string | null, description?: string | null, datePublished?: number | null, hash?: string | null, issuesHash?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, tags?: Array<string | null> | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null, language?: Language | null, status?: SeriesStatus | null, contentRating?: ContentRating | null, seriesType?: ComicSeriesType | null, isCompleted?: boolean | null, issueCount?: number | null, hostingProviderUuid?: string | null, creators?: Array<{ __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, avatarImageAsString?: string | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null } | null> | null } | null, getIssuesForComicSeries?: { __typename?: 'ComicIssueForSeries', seriesUuid: string, issues?: Array<{ __typename?: 'ComicIssue', uuid: string, seriesUuid: string, name?: string | null, position?: number | null, thumbnailImageAsString?: string | null, datePublished?: number | null, scopesForExclusiveContent?: Array<string | null> | null, dateExclusiveContentAvailable?: number | null } | null> | null } | null, getStatsForComicSeries?: Array<{ __typename?: 'ComicIssueStats', seriesUuid: string, issueUuid: string, likeCount?: number | null }> | null };

export type GetCommentsQueryVariables = Exact<{
  targetUuid: Scalars['ID']['input'];
  targetType: InkverseType;
  page?: InputMaybe<Scalars['Int']['input']>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<CommentSortType>;
}>;


export type GetCommentsQuery = { __typename?: 'Query', getComments: Array<{ __typename?: 'Comment', uuid: string, text: string, createdAt: number, targetUuid: string, targetType: InkverseType, replyToUuid?: string | null, user?: { __typename?: 'User', id: string, username?: string | null } | null, stats?: { __typename?: 'CommentStats', uuid: string, likeCount?: number | null, replyCount?: number | null } | null }> };

export type GetCreatorQueryVariables = Exact<{
  uuid: Scalars['ID']['input'];
}>;


export type GetCreatorQuery = { __typename?: 'Query', getCreator?: { __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, bio?: string | null, avatarImageAsString?: string | null, comics?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null } | null };

export type GetDocumentationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetDocumentationQuery = { __typename?: 'Query', getDocumentation?: { __typename?: 'Documentation', id?: string | null, text?: string | null } | null };

export type GetListQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetListQuery = { __typename?: 'Query', getList?: { __typename?: 'List', id: string, name?: string | null, description?: string | null, bannerImageUrl?: string | null, type: ListType, privacyType: PrivacyType, userId: string, comicSeries?: Array<{ __typename?: 'ComicSeries', description?: string | null, uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null };

export type GetMeDetailsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeDetailsQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username?: string | null, email?: string | null, isEmailVerified?: boolean | null, ageRange?: UserAgeRange | null, birthYear?: number | null, blueskyDid?: string | null } | null };

export type GetMiniComicSeriesQueryVariables = Exact<{
  uuid?: InputMaybe<Scalars['ID']['input']>;
  shortUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMiniComicSeriesQuery = { __typename?: 'Query', getComicSeries?: { __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null };

export type GetMiniCreatorQueryVariables = Exact<{
  uuid?: InputMaybe<Scalars['ID']['input']>;
  shortUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetMiniCreatorQuery = { __typename?: 'Query', getCreator?: { __typename?: 'Creator', uuid: string, name?: string | null, shortUrl?: string | null, avatarImageAsString?: string | null, links?: Array<{ __typename?: 'LinkDetails', url?: string | null, type?: LinkType | null } | null> | null } | null };

export type GetProfileByUserIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetProfileByUserIdQuery = { __typename?: 'Query', getUserById?: { __typename?: 'User', id: string, username?: string | null } | null, getUserSubscribedComics?: { __typename?: 'ProfileComicSeries', userId: string, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null };

export type GetRepliesForCommentQueryVariables = Exact<{
  targetUuid: Scalars['ID']['input'];
  targetType: InkverseType;
  commentUuid: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetRepliesForCommentQuery = { __typename?: 'Query', getRepliesForComment: Array<{ __typename?: 'Comment', uuid: string, text: string, createdAt: number, targetUuid: string, targetType: InkverseType, replyToUuid?: string | null, user?: { __typename?: 'User', id: string, username?: string | null } | null, stats?: { __typename?: 'CommentStats', uuid: string, likeCount?: number | null, replyCount?: number | null } | null }> };

export type GetUserByUsernameQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type GetUserByUsernameQuery = { __typename?: 'Query', getUserByUsername?: { __typename?: 'User', id: string, username?: string | null } | null };

export type GetUserComicSeriesQueryVariables = Exact<{
  seriesUuid: Scalars['ID']['input'];
}>;


export type GetUserComicSeriesQuery = { __typename?: 'Query', getUserComicSeries?: { __typename?: 'UserComicSeries', seriesUuid: string, isSubscribed: boolean, isRecommended: boolean, hasNotificationEnabled: boolean, likedComicIssueUuids: Array<string | null> } | null };

export type GetUserCommentsQueryVariables = Exact<{
  targetUuid: Scalars['ID']['input'];
  targetType: InkverseType;
}>;


export type GetUserCommentsQuery = { __typename?: 'Query', getUserComments?: { __typename?: 'UserComment', targetUuid: string, targetType: InkverseType, likedCommentUuids: Array<string | null> } | null };

export type HomeScreenQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeScreenQuery = { __typename?: 'Query', getFeaturedComicSeries?: { __typename?: 'HomeScreenComicSeries', id?: string | null, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null, getCuratedLists?: { __typename?: 'HomeScreenCuratedList', id?: string | null, lists?: Array<{ __typename?: 'List', id: string, name?: string | null, description?: string | null, bannerImageUrl?: string | null, type: ListType, privacyType: PrivacyType } | null> | null } | null, getMostPopularComicSeries?: { __typename?: 'HomeScreenComicSeries', id?: string | null, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null, getRecentlyAddedComicSeries?: { __typename?: 'HomeScreenComicSeries', id?: string | null, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null, getRecentlyUpdatedComicSeries?: { __typename?: 'HomeScreenComicSeries', id?: string | null, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null };

export type SearchQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  limitPerPage?: InputMaybe<Scalars['Int']['input']>;
  filterForTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  filterForTags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  filterForGenres?: InputMaybe<Array<InputMaybe<Genre>> | InputMaybe<Genre>>;
}>;


export type SearchQuery = { __typename?: 'Query', search?: { __typename?: 'SearchResults', searchId: string, comicSeries?: Array<{ __typename?: 'ComicSeries', uuid: string, name?: string | null, shortUrl?: string | null, coverImageAsString?: string | null, bannerImageAsString?: string | null, thumbnailImageAsString?: string | null, genre0?: Genre | null, genre1?: Genre | null, genre2?: Genre | null } | null> | null } | null };

export const MiniComicIssueDetails = gql`
    fragment miniComicIssueDetails on ComicIssue {
  uuid
  seriesUuid
  name
  position
  thumbnailImageAsString
  datePublished
  scopesForExclusiveContent
  dateExclusiveContentAvailable
}
    `;
export const ComicIssueDetails = gql`
    fragment comicIssueDetails on ComicIssue {
  ...miniComicIssueDetails
  bannerImageAsString
  creatorNote
  stories {
    uuid
    issueUuid
    seriesUuid
    storyImageAsString
    width
    height
  }
  previousIssue {
    ...miniComicIssueDetails
  }
  nextIssue {
    ...miniComicIssueDetails
  }
}
    ${MiniComicIssueDetails}`;
export const ComicSeriesDetails = gql`
    fragment comicSeriesDetails on ComicSeries {
  uuid
  name
  description
  datePublished
  hash
  issuesHash
  shortUrl
  coverImageAsString
  bannerImageAsString
  thumbnailImageAsString
  tags
  genre0
  genre1
  genre2
  language
  status
  contentRating
  seriesType
  isCompleted
  issueCount
  hostingProviderUuid
}
    `;
export const MiniUserDetails = gql`
    fragment miniUserDetails on User {
  id
  username
}
    `;
export const CommentDetails = gql`
    fragment commentDetails on Comment {
  uuid
  text
  createdAt
  user {
    ...miniUserDetails
  }
  targetUuid
  targetType
  replyToUuid
  stats {
    uuid
    likeCount
    replyCount
  }
}
    ${MiniUserDetails}`;
export const CreatorDetails = gql`
    fragment creatorDetails on Creator {
  uuid
  name
  shortUrl
  bio
  avatarImageAsString
  links {
    url
    type
  }
}
    `;
export const MiniComicSeriesDetails = gql`
    fragment miniComicSeriesDetails on ComicSeries {
  uuid
  name
  shortUrl
  coverImageAsString
  bannerImageAsString
  thumbnailImageAsString
  genre0
  genre1
  genre2
}
    `;
export const ListDetails = gql`
    fragment listDetails on List {
  id
  name
  description
  bannerImageUrl
  type
  privacyType
  userId
  comicSeries {
    ...miniComicSeriesDetails
    description
  }
}
    ${MiniComicSeriesDetails}`;
export const MiniCreatorDetails = gql`
    fragment miniCreatorDetails on Creator {
  uuid
  name
  shortUrl
  avatarImageAsString
  links {
    url
    type
  }
}
    `;
export const UserComicSeriesDetails = gql`
    fragment userComicSeriesDetails on UserComicSeries {
  seriesUuid
  isSubscribed
  isRecommended
  hasNotificationEnabled
  likedComicIssueUuids
}
    `;
export const UserCommentDetails = gql`
    fragment userCommentDetails on UserComment {
  targetUuid
  targetType
  likedCommentUuids
}
    `;
export const UserDetails = gql`
    fragment userDetails on User {
  id
  username
  email
  isEmailVerified
  ageRange
  birthYear
  blueskyDid
}
    `;
export const AddComment = gql`
    mutation AddComment($issueUuid: ID!, $seriesUuid: ID!, $text: String!, $replyToCommentUuid: ID) {
  addComment(
    issueUuid: $issueUuid
    seriesUuid: $seriesUuid
    text: $text
    replyToCommentUuid: $replyToCommentUuid
  ) {
    ...commentDetails
  }
}
    ${CommentDetails}`;
export const DeleteComment = gql`
    mutation DeleteComment($commentUuid: ID!) {
  deleteComment(commentUuid: $commentUuid)
}
    `;
export const DisableNotificationsForSeries = gql`
    mutation DisableNotificationsForSeries($seriesUuid: ID!) {
  disableNotificationsForSeries(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const EditComment = gql`
    mutation EditComment($commentUuid: ID!, $text: String!) {
  editComment(commentUuid: $commentUuid, text: $text) {
    ...commentDetails
  }
}
    ${CommentDetails}`;
export const EnableNotificationsForSeries = gql`
    mutation EnableNotificationsForSeries($seriesUuid: ID!) {
  enableNotificationsForSeries(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const FetchAllHostingProviderTokens = gql`
    mutation FetchAllHostingProviderTokens {
  fetchAllHostingProviderTokens
}
    `;
export const FetchRefreshTokenForHostingProvider = gql`
    mutation FetchRefreshTokenForHostingProvider($hostingProviderUuid: String!) {
  fetchRefreshTokenForHostingProvider(hostingProviderUuid: $hostingProviderUuid)
}
    `;
export const LikeComicIssue = gql`
    mutation LikeComicIssue($issueUuid: ID!, $seriesUuid: ID!) {
  likeComicIssue(issueUuid: $issueUuid, seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const LikeComment = gql`
    mutation LikeComment($commentUuid: ID!, $issueUuid: ID!) {
  likeComment(commentUuid: $commentUuid, issueUuid: $issueUuid) {
    ...userCommentDetails
  }
}
    ${UserCommentDetails}`;
export const ReportComicSeries = gql`
    mutation ReportComicSeries($uuid: ID!, $reportType: ReportType!) {
  reportComicSeries(uuid: $uuid, reportType: $reportType)
}
    `;
export const ReportComment = gql`
    mutation ReportComment($commentUuid: ID!, $reportType: ReportType!, $additionalInfo: String) {
  reportComment(
    commentUuid: $commentUuid
    reportType: $reportType
    additionalInfo: $additionalInfo
  )
}
    `;
export const ResendVerificationEmail = gql`
    mutation ResendVerificationEmail {
  resendVerificationEmail
}
    `;
export const SaveBlueskyDid = gql`
    mutation SaveBlueskyDid($did: String!) {
  saveBlueskyDid(did: $did) {
    id
    blueskyDid
  }
}
    `;
export const SavePushToken = gql`
    mutation SavePushToken($fcmToken: String!, $platform: String!) {
  savePushToken(fcmToken: $fcmToken, platform: $platform)
}
    `;
export const SubscribeToMultipleComicSeries = gql`
    mutation SubscribeToMultipleComicSeries($seriesUuids: [ID!]!) {
  subscribeToMultipleComicSeries(seriesUuids: $seriesUuids)
}
    `;
export const SubscribeToSeries = gql`
    mutation SubscribeToSeries($seriesUuid: ID!) {
  subscribeToSeries(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const SuperLikeAllEpisodes = gql`
    mutation SuperLikeAllEpisodes($seriesUuid: ID!) {
  superLikeAllEpisodes(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const UnlikeComicIssue = gql`
    mutation UnlikeComicIssue($issueUuid: ID!, $seriesUuid: ID!) {
  unlikeComicIssue(issueUuid: $issueUuid, seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const UnlikeComment = gql`
    mutation UnlikeComment($commentUuid: ID!, $issueUuid: ID!) {
  unlikeComment(commentUuid: $commentUuid, issueUuid: $issueUuid) {
    ...userCommentDetails
  }
}
    ${UserCommentDetails}`;
export const UnsubscribeFromSeries = gql`
    mutation UnsubscribeFromSeries($seriesUuid: ID!) {
  unsubscribeFromSeries(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const UpdateUserEmail = gql`
    mutation UpdateUserEmail($email: String!) {
  updateUserEmail(email: $email) {
    ...userDetails
  }
}
    ${UserDetails}`;
export const UpdateUserProfile = gql`
    mutation UpdateUserProfile($username: String, $ageRange: UserAgeRange, $birthYear: Int) {
  updateUserProfile(
    username: $username
    ageRange: $ageRange
    birthYear: $birthYear
  ) {
    ...userDetails
  }
}
    ${UserDetails}`;
export const CannySso = gql`
    query CannySso($redirectPath: String) {
  cannySso(redirectPath: $redirectPath) {
    userId
    ssoToken
    redirectUrl
  }
}
    `;
export const GetBlueskyProfile = gql`
    query GetBlueskyProfile($handle: String!) {
  getBlueskyProfile(handle: $handle) {
    did
    handle
    displayName
    avatar
    description
  }
}
    `;
export const GetComicIssueStats = gql`
    query GetComicIssueStats($issueUuid: ID!, $seriesUuid: ID!) {
  getStatsForComicIssue(issueUuid: $issueUuid, seriesUuid: $seriesUuid) {
    seriesUuid
    issueUuid
    likeCount
  }
}
    `;
export const GetComicSeriesStats = gql`
    query GetComicSeriesStats($seriesUuid: ID!) {
  getStatsForComicSeries(seriesUuid: $seriesUuid) {
    seriesUuid
    issueUuid
    likeCount
  }
}
    `;
export const GetComicIssue = gql`
    query GetComicIssue($issueUuid: ID!, $seriesUuid: ID!) {
  getComicIssue(uuid: $issueUuid, seriesUuid: $seriesUuid) {
    ...comicIssueDetails
  }
  getComicSeries(uuid: $seriesUuid) {
    ...comicSeriesDetails
    creators {
      ...miniCreatorDetails
    }
  }
  getCreatorLinksForSeries(seriesUuid: $seriesUuid) {
    creatorUuid
    type
    url
  }
  getStatsForComicIssue(issueUuid: $issueUuid, seriesUuid: $seriesUuid) {
    seriesUuid
    issueUuid
    likeCount
  }
}
    ${ComicIssueDetails}
${ComicSeriesDetails}
${MiniCreatorDetails}`;
export const GetComicsFromBlueskyCreators = gql`
    query GetComicsFromBlueskyCreators {
  getComicsFromBlueskyCreators {
    ...miniComicSeriesDetails
  }
}
    ${MiniComicSeriesDetails}`;
export const GetComicsFromPatreonCreators = gql`
    query GetComicsFromPatreonCreators {
  getComicsFromPatreonCreators {
    ...miniComicSeriesDetails
  }
}
    ${MiniComicSeriesDetails}`;
export const GetComicSeries = gql`
    query GetComicSeries($uuid: ID!, $sortOrderForIssues: SortOrder, $limitPerPageForIssues: Int, $pageForIssues: Int) {
  getComicSeries(uuid: $uuid) {
    ...comicSeriesDetails
    creators {
      ...miniCreatorDetails
    }
  }
  getIssuesForComicSeries(
    seriesUuid: $uuid
    sortOrder: $sortOrderForIssues
    limitPerPage: $limitPerPageForIssues
    page: $pageForIssues
  ) {
    seriesUuid
    issues {
      ...miniComicIssueDetails
    }
  }
  getStatsForComicSeries(seriesUuid: $uuid) {
    seriesUuid
    issueUuid
    likeCount
  }
}
    ${ComicSeriesDetails}
${MiniCreatorDetails}
${MiniComicIssueDetails}`;
export const GetComments = gql`
    query GetComments($targetUuid: ID!, $targetType: InkverseType!, $page: Int, $limitPerPage: Int, $sortBy: CommentSortType) {
  getComments(
    targetUuid: $targetUuid
    targetType: $targetType
    page: $page
    limitPerPage: $limitPerPage
    sortBy: $sortBy
  ) {
    ...commentDetails
  }
}
    ${CommentDetails}`;
export const GetCreator = gql`
    query GetCreator($uuid: ID!) {
  getCreator(uuid: $uuid) {
    ...creatorDetails
    comics {
      ...miniComicSeriesDetails
    }
  }
}
    ${CreatorDetails}
${MiniComicSeriesDetails}`;
export const GetDocumentation = gql`
    query GetDocumentation($id: ID!) {
  getDocumentation(id: $id) {
    id
    text
  }
}
    `;
export const GetList = gql`
    query GetList($id: ID!) {
  getList(id: $id) {
    ...listDetails
  }
}
    ${ListDetails}`;
export const GetMeDetails = gql`
    query GetMeDetails {
  me {
    ...userDetails
  }
}
    ${UserDetails}`;
export const GetMiniComicSeries = gql`
    query GetMiniComicSeries($uuid: ID, $shortUrl: String) {
  getComicSeries(uuid: $uuid, shortUrl: $shortUrl) {
    ...miniComicSeriesDetails
  }
}
    ${MiniComicSeriesDetails}`;
export const GetMiniCreator = gql`
    query GetMiniCreator($uuid: ID, $shortUrl: String) {
  getCreator(uuid: $uuid, shortUrl: $shortUrl) {
    ...miniCreatorDetails
  }
}
    ${MiniCreatorDetails}`;
export const GetProfileByUserId = gql`
    query GetProfileByUserId($id: ID!) {
  getUserById(id: $id) {
    ...miniUserDetails
  }
  getUserSubscribedComics(userId: $id, limitPerPage: 1000, page: 1) {
    userId
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
}
    ${MiniUserDetails}
${MiniComicSeriesDetails}`;
export const GetRepliesForComment = gql`
    query GetRepliesForComment($targetUuid: ID!, $targetType: InkverseType!, $commentUuid: ID!, $page: Int, $limitPerPage: Int) {
  getRepliesForComment(
    targetUuid: $targetUuid
    targetType: $targetType
    commentUuid: $commentUuid
    page: $page
    limitPerPage: $limitPerPage
  ) {
    ...commentDetails
  }
}
    ${CommentDetails}`;
export const GetUserByUsername = gql`
    query GetUserByUsername($username: String!) {
  getUserByUsername(username: $username) {
    ...miniUserDetails
  }
}
    ${MiniUserDetails}`;
export const GetUserComicSeries = gql`
    query GetUserComicSeries($seriesUuid: ID!) {
  getUserComicSeries(seriesUuid: $seriesUuid) {
    ...userComicSeriesDetails
  }
}
    ${UserComicSeriesDetails}`;
export const GetUserComments = gql`
    query GetUserComments($targetUuid: ID!, $targetType: InkverseType!) {
  getUserComments(targetUuid: $targetUuid, targetType: $targetType) {
    ...userCommentDetails
  }
}
    ${UserCommentDetails}`;
export const HomeScreen = gql`
    query HomeScreen {
  getFeaturedComicSeries {
    id
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
  getCuratedLists {
    id
    lists {
      id
      name
      description
      bannerImageUrl
      type
      privacyType
    }
  }
  getMostPopularComicSeries {
    id
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
  getRecentlyAddedComicSeries {
    id
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
  getRecentlyUpdatedComicSeries {
    id
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
}
    ${MiniComicSeriesDetails}`;
export const Search = gql`
    query Search($term: String, $page: Int, $limitPerPage: Int, $filterForTypes: [String], $filterForTags: [String], $filterForGenres: [Genre]) {
  search(
    term: $term
    page: $page
    limitPerPage: $limitPerPage
    filterForTypes: $filterForTypes
    filterForTags: $filterForTags
    filterForGenres: $filterForGenres
  ) {
    searchId
    comicSeries {
      ...miniComicSeriesDetails
    }
  }
}
    ${MiniComicSeriesDetails}`;