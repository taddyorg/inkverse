export const CommonDefinitions = `

" Different Sort orders "
enum SortOrder {
  LATEST
  OLDEST
  SEARCH
}

" Countries (ISO 3166-1 https://en.wikipedia.org/wiki/ISO_3166-1) "
enum Country {
  AFGHANISTAN
  ALAND_ISLANDS
  ALBANIA
  ALGERIA
  AMERICAN_SAMOA
  ANDORRA
  ANGOLA
  ANGUILLA
  ANTARCTICA
  ANTIGUA_AND_BARBUDA
  ARGENTINA
  ARMENIA
  ARUBA
  AUSTRALIA
  AUSTRIA
  AZERBAIJAN
  BAHAMAS
  BAHRAIN
  BANGLADESH
  BARBADOS
  BELARUS
  BELGIUM
  BELIZE
  BENIN
  BERMUDA
  BHUTAN
  BOLIVIA_PLURINATIONAL_STATE_OF
  BONAIRE_SINT_EUSTATIUS_AND_SABA
  BOSNIA_AND_HERZEGOVINA
  BOTSWANA
  BOUVET_ISLAND
  BRAZIL
  BRITISH_INDIAN_OCEAN_TERRITORY_THE
  BRUNEI_DARUSSALAM
  BULGARIA
  BURKINA_FASO
  BURUNDI
  CABO_VERDE
  CAMBODIA
  CAMEROON
  CANADA
  CAYMAN_ISLANDS
  CENTRAL_AFRICAN_REPUBLIC
  CHAD
  CHILE
  CHINA
  CHRISTMAS_ISLAND
  COCOS_KEELING_ISLANDS
  COLOMBIA
  COMOROS
  CONGO
  CONGO_THE_DEMOCRATIC_REPUBLIC_OF
  COOK_ISLANDS
  COSTA_RICA
  COTE_D_IVOIRE
  CROATIA
  CUBA
  CURACAO
  CYPRUS
  CZECHIA
  DENMARK
  DJIBOUTI
  DOMINICA
  DOMINICAN_REPUBLIC
  ECUADOR
  EGYPT
  EL_SALVADOR
  EQUATORIAL_GUINEA
  ERITREA
  ESTONIA
  ESWATINI
  ETHIOPIA
  FALKLAND_ISLANDS_THE_MALVINAS
  FAROE_ISLANDS
  FIJI
  FINLAND
  FRANCE
  FRENCH_GUIANA
  FRENCH_POLYNESIA
  FRENCH_SOUTHERN_TERRITORIES
  GABON
  GAMBIA
  GEORGIA
  GERMANY
  GHANA
  GIBRALTAR
  GREECE
  GREENLAND
  GRENADA
  GUADELOUPE
  GUAM
  GUATEMALA
  GUERNSEY
  GUINEA
  GUINEA_BISSAU
  GUYANA
  HAITI
  HEARD_ISLAND_AND_MCDONALD_ISLANDS
  HOLY_SEE
  HONDURAS
  HONG_KONG
  HUNGARY
  ICELAND
  INDIA
  INDONESIA
  IRAN
  IRAQ
  IRELAND
  ISLE_OF_MAN
  ISRAEL
  ITALY
  JAMAICA
  JAPAN
  JERSEY
  JORDAN
  KAZAKHSTAN
  KENYA
  KIRIBATI
  KOREA_NORTH
  KOREA_SOUTH
  KUWAIT
  KYRGYZSTAN
  LAO_PEOPLES_DEMOCRATIC_REPUBLIC_THE
  LATVIA
  LEBANON
  LESOTHO
  LIBERIA
  LIBYA
  LIECHTENSTEIN
  LITHUANIA
  LUXEMBOURG
  MACAO
  MADAGASCAR
  MALAWI
  MALAYSIA
  MALDIVES
  MALI
  MALTA
  MARSHALL_ISLANDS
  MARTINIQUE
  MAURITANIA
  MAURITIUS
  MAYOTTE
  MEXICO
  MICRONESIA_FEDERATED_STATES
  MINOR_OUTLYING_ISLANDS_US
  MOLDOVA_THE_REPUBLIC
  MONACO
  MONGOLIA
  MONTENEGRO
  MONTSERRAT
  MOROCCO
  MOZAMBIQUE
  MYANMAR
  NAMIBIA
  NAURU
  NEPAL
  NETHERLANDS
  NEW_CALEDONIA
  NEW_ZEALAND
  NICARAGUA
  NIGER
  NIGERIA
  NIUE
  NORFOLK_ISLAND
  NORTH_MACEDONIA
  NORTHERN_MARIANA_ISLANDS
  NORWAY
  OMAN
  PAKISTAN
  PALAU
  PALESTINE_STATE
  PANAMA
  PAPUA_NEW_GUINEA
  PARAGUAY
  PERU
  PHILIPPINES
  PITCAIRN
  POLAND
  PORTUGAL
  PUERTO_RICO
  QATAR
  REUNION
  ROMANIA
  RUSSIA
  RWANDA
  SAINT_BARTHELEMY
  SAINT_HELENA_ASCENSION_AND_TRISTAN_DA_CUNHA
  SAINT_KITTS_AND_NEVIS
  SAINT_LUCIA
  SAINT_MARTIN_FRENCH_PART
  SAINT_PIERRE_AND_MIQUELON
  SAINT_VINCENT_AND_THE_GRENADINES
  SAMOA
  SAN_MARINO
  SAO_TOME_AND_PRINCIPE
  SAUDI_ARABIA
  SENEGAL
  SERBIA
  SEYCHELLES
  SIERRA_LEONE
  SINGAPORE
  SINT_MAARTEN_DUTCH_PART
  SLOVAKIA
  SLOVENIA
  SOLOMON_ISLANDS
  SOMALIA
  SOUTH_AFRICA
  SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS
  SOUTH_SUDAN
  SPAIN
  SRI_LANKA
  SUDAN
  SURINAME
  SVALBARD_AND_JAN_MAYEN
  SWEDEN
  SWITZERLAND
  SYRIA
  TAIWAN
  TAJIKISTAN
  TANZANIA
  THAILAND
  TIMOR_LESTE
  TOGO
  TOKELAU
  TONGA
  TRINIDAD_AND_TOBAGO
  TUNISIA
  TURKEY
  TURKMENISTAN
  TURKS_AND_CAICOS_ISLANDS
  TUVALU
  UGANDA
  UKRAINE
  UNITED_ARAB_EMIRATES
  UNITED_KINGDOM
  UNITED_STATES_OF_AMERICA
  URUGUAY
  UZBEKISTAN
  VANUATU
  VENEZUELA
  VIETNAM
  VIRGIN_ISLANDS_BRITISH
  VIRGIN_ISLANDS_US
  WALLIS_AND_FUTUNA
  WESTERN_SAHARA
  YEMEN
  ZAMBIA
  ZIMBABWE
}

" Languages (ISO 639-2 https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) "
enum Language {
  ABKHAZIAN
  AFAR
  AFRIKAANS
  AKAN
  ALBANIAN
  AMHARIC
  ARABIC
  ARAGONESE
  ARMENIAN
  ASSAMESE
  AVARIC
  AVESTAN
  AYMARA
  AZERBAIJANI
  BAMBARA
  BASHKIR
  BASQUE
  BELARUSIAN
  BENGALI
  BIHARI_LANGUAGES
  BISLAMA
  BOSNIAN
  BRETON
  BULGARIAN
  BURMESE
  CENTRAL_KHMER
  CHAMORRO
  CHECHEN
  CHICHEWA_CHEWA_NYANJA
  CHINESE
  CHURCH_SLAVONIC
  CHUVASH
  CORNISH
  CORSICAN
  CREE
  CROATIAN
  CZECH
  DANISH
  DHIVEHI_MALDIVIAN
  DUTCH_FLEMISH
  DZONGKHA
  ENGLISH
  ESPERANTO
  ESTONIAN
  EWE
  FAROESE
  FARSI
  FIJIAN
  FINNISH
  FRENCH
  FULAH
  GAELIC
  GALICIAN
  GANDA
  GEORGIAN
  GERMAN
  GIKUYU
  GREEK
  GUARANI
  GUJARATI
  HAITIAN_CREOLE
  HAUSA
  HEBREW
  HERERO
  HINDI
  HIRI_MOTU
  HUNGARIAN
  ICELANDIC
  IDO
  IGBO
  INDONESIAN
  INTERLINGUA
  INTERLINGUE_OCCIDENTAL
  INUKTITUT
  INUPIAQ
  IRISH
  ITALIAN
  JAPANESE
  JAVANESE
  KALAALLISUT_GREENLANDIC
  KANNADA
  KANURI
  KASHMIRI
  KAZAKH
  KINYARWANDA
  KOMI
  KONGO
  KOREAN
  KURDISH
  KWANYAMA
  KYRGYZ
  LAO
  LATIN
  LATVIAN
  LETZEBURGESCH
  LIMBURGISH
  LINGALA
  LITHUANIAN
  LUBA_KATANGA
  MACEDONIAN
  MALAGASY
  MALAY
  MALAYALAM
  MALTESE
  MANX
  MAORI
  MARATHI
  MARSHALLESE
  MONGOLIAN
  NAURU
  NAVAJO
  NDONGA
  NEPALI
  NORTH_NDEBELE
  NORTHERN_SAMI
  NORWEGIAN
  NORWEGIAN_BOKMAL
  NORWEGIAN_NYNORSK
  NUOSU_SICHUAN_YI
  OCCITAN
  OJIBWA
  ORIYA
  OROMO
  OSSETIAN
  PALI
  PASHTO
  POLISH
  PORTUGUESE
  PUNJABI
  QUECHUA
  ROMANIAN_MOLDOVAN
  ROMANSH
  RUNDI
  RUSSIAN
  SAMOAN
  SANGO
  SANSKRIT
  SARDINIAN
  SERBIAN
  SHONA
  SINDHI
  SINHALA
  SLOVAK
  SLOVENIAN
  SOMALI
  SOTHO
  SOUTH_NDEBELE
  SPANISH
  SUNDANESE
  SWAHILI
  SWATI
  SWEDISH
  TAGALOG
  TAHITIAN
  TAJIK
  TAMIL
  TATAR
  TELUGU
  THAI
  TIBETAN
  TIGRINYA
  TONGA
  TSONGA
  TSWANA
  TURKISH
  TURKMEN
  TWI
  UKRAINIAN
  URDU
  UYGHUR
  UZBEK
  VALENCIAN_CATALAN
  VENDA
  VIETNAMESE
  VOLAPUK
  WALLOON
  WELSH
  WESTERN_FRISIAN
  WOLOF
  XHOSA
  YIDDISH
  YORUBA
  ZHUANG
  ZULU
}

" Genres for different media types. Follows format: TYPE_GENRE_SUBGENRE "
enum Genre {
  COMICSERIES_ACTION
  COMICSERIES_COMEDY
  COMICSERIES_CRIME
  COMICSERIES_DRAMA
  COMICSERIES_DYSTOPIA
  COMICSERIES_EDUCATIONAL
  COMICSERIES_FANTASY
  COMICSERIES_HIGH_SCHOOL
  COMICSERIES_HISTORICAL
  COMICSERIES_HORROR
  COMICSERIES_HAREM
  COMICSERIES_ISEKAI
  COMICSERIES_MYSTERY
  COMICSERIES_ROMANCE
  COMICSERIES_SCI_FI
  COMICSERIES_SLICE_OF_LIFE
  COMICSERIES_SUPERHERO
  COMICSERIES_SUPERNATURAL
  COMICSERIES_BL
  COMICSERIES_GL
  COMICSERIES_LGBTQ
  COMICSERIES_THRILLER
  COMICSERIES_ZOMBIES
  COMICSERIES_POST_APOCALYPTIC
  COMICSERIES_SPORTS
  COMICSERIES_ANIMALS
  COMICSERIES_GAMING
}

" Content rating for different media types. Follows format: TYPE_RATING "
enum ContentRating {
  COMICSERIES_BABY
  COMICSERIES_KIDS
  COMICSERIES_TEENS
  COMICSERIES_MATURE_TEENS
  COMICSERIES_ADULTS
  COMICSERIES_PORNOGRAPHY
}

" Content roles for different media types. Follows format: TYPE_ROLE_SUBROLE "
enum ContentRole {
  COMICSERIES_ARTIST
  COMICSERIES_ARTIST_PENCILER
  COMICSERIES_ARTIST_INKER
  COMICSERIES_ARTIST_COLORIST
  COMICSERIES_ARTIST_LETTERER
  COMICSERIES_WRITER
  COMICSERIES_PRODUCER
  COMICSERIES_EDITOR
  COMICSERIES_TRANSLATOR
}

" Types of media available on Taddy "
enum TaddyType {
  COMICSERIES
  COMICISSUE
  CREATOR
  CREATORCONTENT
}

" Status of Series "
 enum SeriesStatus {
  ONGOING
  HIATUS
  COMPLETED
  CANCELLED
  ANNOUNCED
  UNDER_REVISION
}

" Type of comic series "
enum ComicSeriesType {
  WEBTOON
}

" Layout types for comic series "
enum ComicSeriesLayoutType {
  VERTICAL_SCROLL_TOP_TO_BOTTOM
}
`