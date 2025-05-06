const developmentConfig = {
  "SERVER_URL": "http://inkverse.test:3010/api/graphql",
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: '0000000000',
    HOST_URL: 'https://us.i.posthog.com'
  },
}

const developmentConfigButProductionData = {
  "SERVER_URL": "https://api-v2.inkverse.co",
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: '0000000000',
    HOST_URL: 'https://us.i.posthog.com'
  },
}

const productionConfig = {
  "SERVER_URL": "https://api-v2.inkverse.co",
  "SENTRY_URL": "https://c295077d608f4d67835c2391ee0a688d@o4504175906455553.ingest.sentry.io/4504175951544320",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
}

export default process.env.NODE_ENV === 'production'  
  ? productionConfig
  : developmentConfig