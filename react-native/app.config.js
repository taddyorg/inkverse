export default {
  expo: {
    name: "Inkverse",
    slug: "inkverse",
    version: "3.1",
    orientation: "portrait",
    icon: "./assets/icons/ios-light.png",
    scheme: "inkverse",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    jsEngine: "hermes",
    ios: {
      bundleIdentifier: "art.bamcomics.taddy",
      buildNumber: "11",
      supportsTablet: false,
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "https",
          "mailto",
          "itms-apps"
        ],
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:inkverse.co"
      ],
      appleTeamId: "4AF4P2U4ZF",
      usesAppleSignIn: true
    },
    android: {
      package: "com.bamtoons",
      versionCode: 88,
      minSdkVersion: 35,
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#FFE9E4"
      },
      permissions: [
        "android.permission.INTERNET"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES ?? "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "inkverse.co"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    plugins: [
      "@bacons/apple-targets",
      [
        "@sentry/react-native/expo",
        {
          organization: "inkverse",
          project: "react-native",
          url: "https://sentry.io/"
        }
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFE9E4",
          image: "./assets/images/inkverse-logo.png",
          imageWidth: 200
        }
      ],
      "expo-localization",
      [
        "expo-font",
        {
          fonts: [
            "assets/fonts/SourceSans3-Regular.ttf",
            "assets/fonts/SourceSans3-SemiBold.ttf",
            "assets/fonts/SourceSans3-Bold.ttf"
          ]
        }
      ],
      [
        "react-native-edge-to-edge",
        {
          android: {
            parentTheme: "Light",
            enforceNavigationBarContrast: false,
            // Keep navigation bar visible but transparent
            navigationBarStyle: "light",
            navigationBarColor: "transparent"
          }
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.485860487313-mecvs6na5ih575klndmmiu3li1ikjiod"
        }
      ],
      "expo-apple-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/icons/android-push.png"
        }
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "149ba335-e117-4b21-8359-41b61b059885"
      }
    }
  }
};