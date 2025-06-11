import { Platform } from 'react-native';

const developmentConfig = {
  "SERVER_URL": getGraphQLURL(false),
  "AUTH_URL": getAuthURL(false),
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
}

const developmentConfigButProductionData = {
  "SERVER_URL": getGraphQLURL(true),
  "AUTH_URL": getAuthURL(true),
  "SENTRY_URL": "https://09be2495177f48c48f6161ad3b37949a@o4504175906455553.ingest.sentry.io/4504175947612160",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
}

const productionConfig = {
  "SERVER_URL": getGraphQLURL(true),
  "AUTH_URL": getAuthURL(true),
  "SENTRY_URL": "https://c295077d608f4d67835c2391ee0a688d@o4504175906455553.ingest.sentry.io/4504175951544320",
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
}

function getGraphQLURL(isProduction: boolean) {
  if (!isProduction) {
    return Platform.OS === 'android' 
      ? `http://10.0.2.2:3010/api/graphql`
      : `http://inkverse.test:3010/api/graphql` 
  } else {
    return "https://api-v2.inkverse.co"
  }
}

function getAuthURL(isProduction: boolean) {
  if (!isProduction) {
    return Platform.OS === 'android' 
      ? `http://10.0.2.2:3010/api/auth`
      : `http://inkverse.test:3010/api/auth` 
  } else {
    return "https://inkverse.co/api/auth"
  }
}

export default __DEV__
  ? developmentConfig
  : productionConfig