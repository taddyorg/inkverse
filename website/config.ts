const developmentConfig = {
  "SERVER_URL": "http://inkverse.test:3010/api/graphql",
  "AUTH_URL": "http://inkverse.test:3010/api/auth",
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID": "485860487313-jddr4ok61k6voj594b1sqhvj18gt7nms.apps.googleusercontent.com", 
  "APPLE_CLIENT_ID": "art.bamcomics.taddy", 
  "APPLE_REDIRECT_URI": "https://inkverse.test:3010/api/auth/login-with-apple", 
}

const developmentConfigButProductionData = {
  "SERVER_URL": "https://api-v2.inkverse.co",
  "AUTH_URL": "https://inkverse.co/api/auth",
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID": "485860487313-ditiq1chl9qjbiaemsthun7bbdstu3tq.apps.googleusercontent.com", 
  "APPLE_CLIENT_ID": "art.bamcomics.taddy", 
  "APPLE_REDIRECT_URI": "https://inkverse.co/api/auth/login-with-apple", 
}

const productionConfig = {
  "SERVER_URL": "https://api-v2.inkverse.co",
  "AUTH_URL": "https://inkverse.co/api/auth",
  "SENTRY_URL": "https://c295077d608f4d67835c2391ee0a688d@o4504175906455553.ingest.sentry.io/4504175951544320",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID": "485860487313-ditiq1chl9qjbiaemsthun7bbdstu3tq.apps.googleusercontent.com", 
  "APPLE_CLIENT_ID": "art.bamcomics.taddy", 
  "APPLE_REDIRECT_URI": "https://inkverse.co/api/auth/login-with-apple", 
}

export default process.env.NODE_ENV === 'production'  
  ? productionConfig
  : developmentConfig