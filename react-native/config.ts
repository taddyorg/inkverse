import { Platform } from 'react-native';

const developmentConfig = {
  "SERVER_URL": getGraphQLURL(false),
  "AUTH_URL": getAuthURL(false),
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_WEB": "485860487313-ditiq1chl9qjbiaemsthun7bbdstu3tq.apps.googleusercontent.com",
  "TADDY_CLIENT_ID":"151",
}

const developmentConfigButProductionData = {
  "SERVER_URL": getGraphQLURL(true),
  "AUTH_URL": getAuthURL(true),
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_WEB": "485860487313-ditiq1chl9qjbiaemsthun7bbdstu3tq.apps.googleusercontent.com",
  "TADDY_CLIENT_ID":"151",
}

const productionConfig = {
  "SERVER_URL": getGraphQLURL(true),
  "AUTH_URL": getAuthURL(true),
  "POST_HOG_INFO": {
    API_KEY: 'phc_ADit78DdDgFCBzE0qksQOat2x8xn4NfISUdVtmkArWD',
    HOST_URL: 'https://us.i.posthog.com'
  },
  "GOOGLE_CLIENT_ID_IOS": "485860487313-mecvs6na5ih575klndmmiu3li1ikjiod.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_ANDROID": "485860487313-b76bdd96ftan9j9cb7um50n75ebvhp8k.apps.googleusercontent.com",
  "GOOGLE_CLIENT_ID_WEB": "485860487313-ditiq1chl9qjbiaemsthun7bbdstu3tq.apps.googleusercontent.com",
  "TADDY_CLIENT_ID":"151",
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